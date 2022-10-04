const mime = require('mime')
const sanitizeFilename = require('sanitize-filename')
const fs = require('fs')
const pdfjslib = require('pdfjs-dist/legacy/build/pdf.js')

const DAOError = require('../errors/DAOError')

const UserDAO = require('./user')
const FileDAO = require('./files')
const FieldDAO = require('./field')
const S3FileService = require('../services/S3FileService')

const PAGE_SIZE = 50 

module.exports = class PaperDAO {

    constructor(database, config) {
        this.database = database
        this.userDAO = new UserDAO(database)
        this.fileDAO = new FileDAO(database)
        this.fieldDAO = new FieldDAO(database)
        this.fileService = new S3FileService(config)
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydratePapers(rows) {
        if ( rows.length == 0 ) {
            return null 
        }

        const papers = {}
        const list = []

        for(const row of rows) {
            const paper = {
                id: row.paper_id,
                title: row.paper_title,
                isDraft: row.paper_isDraft,
                score: row.paper_score,
                createdDate: row.paper_createdDate,
                updatedDate: row.paper_updatedDate,
                authors: [],
                fields: [],
                versions: []
            }

            if ( ! papers[paper.id] ) {
                papers[paper.id] = paper
                list.push(paper)
            }

            const author = {
                id: row.author_id,
                order: row.author_order,
                owner: row.author_owner
            }

            if ( ! papers[paper.id].authors.find((a) => a.id == author.id)) {
                papers[paper.id].authors.push(author)
            }

            const paper_version = {
                file: this.fileDAO.hydrateFile(row),
                version: row.version_version,
                createdDate: row.version_createdDate,
                updatedDate: row.version_updatedDate
            }
            // Ignore versions that haven't finished uploading.
            if (paper_version.version && ! papers[paper.id].versions.find((v) => v.version == paper_version.version)) {
                papers[paper.id].versions.push(paper_version)
            }

            const paper_field = this.fieldDAO.hydrateField(row)

            if ( ! papers[paper.id].fields.find((f) => f.id == paper_field.id)) {
                papers[paper.id].fields.push(paper_field)
            }

        }

        return list 
    }

    /**
     * Select papers from the database, along with all of the data necessary to
     * populate the `paper` object.  Uses a large join to pull all the
     * necessary data from across multiple tables.
     *
     * @param {string}  where   (Optional) An SQL where condition, including the 'WHERE'.
     * @param {any[]}   params  (Optional) An array of parameters, matching the `where` conditional.
     * @param {string}  order   (Optional) An SQL order phrase.  If "active", a proper order phrase will be generated.
     */
    async selectPapers(where, params, order) {
        where = (where ? where : '')
        params = (params ? params : [])

        // TECHDEBT - Definitely not the ideal way to handle this.  But so it goes.
        let activeOrderJoins = ''
        if ( order == 'published-active' ) {
            activeOrderJoins = `
                LEFT OUTER JOIN responses ON responses.paper_id = papers.id
            `
            order = 'greatest(responses.updated_date, papers.updated_date) DESC NULLS LAST, '
        } else if ( order == 'draft-active' ) {
            activeOrderJoins = `
                LEFT OUTER JOIN reviews ON reviews.paper_id = papers.id AND reviews.status != 'in-progress'
                LEFT OUTER JOIN review_comment_threads ON review_comment_threads.review_id = reviews.id
                LEFT OUTER JOIN review_comments ON review_comments.thread_id = review_comment_threads.id AND review_comments.status != 'in-progress'
            `
            order = 'greatest(paper_versions.updated_date, reviews.updated_date, review_comments.updated_date) DESC NULLS LAST, '
        } else {
            order = ( order ? order+', ' : '')
        }

        const sql = `
               SELECT 

                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft",
                    papers.score as paper_score,
                    papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",

                    paper_authors.user_id as author_id, paper_authors.author_order as author_order,
                    paper_authors.owner as author_owner,

                    paper_versions.version as version_version,
                    paper_versions.created_date as "version_createdDate", paper_versions.updated_date as "version_updatedDate",

                    ${ this.fileDAO.getFilesSelectionString() },

                    ${ this.fieldDAO.selectionString }

                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                    LEFT OUTER JOIN files on paper_versions.file_id = files.id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN fields ON paper_fields.field_id = fields.id
                    ${activeOrderJoins}
                ${where} 
                ORDER BY ${order}paper_authors.author_order asc, paper_versions.version desc
        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return [] 
        } else {
            const papers = this.hydratePapers(results.rows)
            for( const paper of papers) {
                for ( const author of paper.authors ) {
                    const users = await this.userDAO.selectUsers('WHERE users.id = $1', [ author.id])
                    author.user = users[0]
                    delete author.id
                }
            }
            return papers
        }
    }

    /**
     *
     */
    async getPage(where, params, order, page) {
        where = (where && where.length ? where : '')
        params = (params && params.length ? [...params] : [])
        order = (order && order.length ? order : 'papers.created_date desc')  

        // TECHDEBT - Definitely not the ideal way to handle this.  But so it goes.
        let activeOrderJoins = ''
        let activeOrderFields = ''
        if ( order == 'published-active' ) {
            activeOrderJoins = `
                LEFT OUTER JOIN responses ON responses.paper_id = papers.id
            `
            activeOrderFields = ', greatest(max(responses.updated_date), max(papers.updated_date)) as activity_date' 
            order = 'activity_date DESC NULLS LAST'
        } else if ( order == 'draft-active' ) {
            activeOrderJoins = `
                LEFT OUTER JOIN reviews ON reviews.paper_id = papers.id AND reviews.status != 'in-progress'
                LEFT OUTER JOIN review_comment_threads ON review_comment_threads.review_id = reviews.id
                LEFT OUTER JOIN review_comments ON review_comments.thread_id = review_comment_threads.id AND review_comments.status != 'in-progress'
            `
            activeOrderFields = ', greatest(max(paper_versions.updated_date), max(reviews.updated_date), max(review_comments.updated_date)) as activity_date'
            order = 'activity_date DESC NULLS LAST, papers.created_date desc'
        }

        params.push(PAGE_SIZE)
        params.push((page-1)*PAGE_SIZE)
        const count = params.length

        const sql = `
               SELECT DISTINCT
                    papers.id as paper_id, papers.created_date as "paper_createdDate"${activeOrderFields}
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                    LEFT OUTER JOIN files on paper_versions.file_id = files.id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN fields ON paper_fields.field_id = fields.id
                    ${activeOrderJoins}
                ${where} 
                GROUP BY papers.id
                ORDER BY ${order}
                LIMIT $${count-1}
                OFFSET $${count}
        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.paper_id)
    }

    /**
     *
     */
    async countPapers(where, params) {
        where = (where ? where : '')
        params = (params ? params : [])

        const sql = `
               SELECT 
                    COUNT(DISTINCT(papers.id)) as paper_count
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN fields ON paper_fields.field_id = fields.id
                ${where} 
        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 || results.rows[0].paper_count == 0) {
            return { 
                count: 0,
                pageSize: PAGE_SIZE,
                numberOfPages: 1

            }
        }

        return { 
            count: results.rows[0].paper_count,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(results.rows[0].paper_count / PAGE_SIZE)+( results.rows[0].paper_count % PAGE_SIZE > 0 ? 1 : 0)
        }
    }

    /**
     *
     */
    async insertPaper(paper) {
        const results = await this.database.query(`
                INSERT INTO papers (title, is_draft, created_date, updated_date) 
                    VALUES ($1, $2, now(), now()) 
                    RETURNING id
                `, 
            [ paper.title, paper.isDraft ]
        )
        if ( results.rows.length == 0 ) {
           throw new DAOError('failed-insertion', 'Failed to insert a paper.')
        }

        return results.rows[0].id

    }

    /**
     * Insert the authors for a paper.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertAuthors(paper) {
        let sql =  `INSERT INTO paper_authors (paper_id, user_id, author_order, owner) VALUES `
        let params = []

        let count = 1
        let authorCount = 1
        for (const author of paper.authors) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3})` + (authorCount < paper.authors.length ? ', ' : '')
            params.push(paper.id, author.user.id, author.order, author.owner)
            count = count+4
            authorCount++
        }

        const results = await this.database.query(sql, params)

        if (results.rowCount == 0 )  {
            throw new DAOError('failed-insertion', 'Something went wrong with the author insertion.')
        }
    }

    /**
     * Insert fields for the paper.  Assumes the field already exists, only
     * inserts the ids into the tagging table.
     *
     * @throws Error Doesn't catch errors, so any errors thrown by the database will bubble up.
     */
    async insertFields(paper) {
        if ( ! paper.fields ) {
            return
        }

        let sql = `INSERT INTO paper_fields (field_id, paper_id) VALUES `
        let params = []

        let count = 1
        let fieldCount = 1
        for (const field of paper.fields) {
            sql += `($${count}, $${count+1})` + (fieldCount < paper.fields.length ? ', ' : '')
            params.push(field.id, paper.id)
            count = count+2
            fieldCount++
        }

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0) {
            throw new DAOError('failed-insertion', 'Something went wrong with field insertion.')
        }
    }

    async insertVersions(paper) {
        for(const version of paper.versions ) {
            await this.insertVersion(paper, version)
        }
    }

    async insertVersion(paper, version) {
        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ version.file.id ])
        if ( files.length <= 0) {
            throw new DAOError('invalid-file', `Invalid file_id posted with paper ${paper.id}.`)
        }
        const file = files[0]

        const maxVersionResults = await this.database.query(
            'SELECT MAX(version)+1 as version FROM paper_versions WHERE paper_id=$1', 
            [ paper.id ]
        )
        let versionNumber = 1
        if ( maxVersionResults.rows.length > 0 && maxVersionResults.rows[0].version) {
            versionNumber = maxVersionResults.rows[0].version
        }

        const url = new URL(file.filepath, file.location)
        const pdf = await pdfjslib.getDocument(url.toString()).promise
        let content = ''
        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber)
            const textContent = await page.getTextContent()

            for(const item of textContent.items ) {
                content += item.str 
            }
        }

        content = content.replace(/\0/g, '')

        if ( content.trim().length == 0 ) {
            console.log('Empty PDF!')
        }

        const versionResults = await this.database.query(`
            INSERT INTO paper_versions (paper_id, version, file_id, is_published, content, created_date, updated_date)
                VALUES ($1, $2, $3, $4, $5, now(), now())
        `, [ paper.id, versionNumber, file.id, version.isPublished, content ])

        if ( versionResults.rowCount <= 0) {
            throw new DAOError('failed-insertion', `Failed to insert version for paper ${paper.id} and file ${file.id}.`)
        }

        const title = paper.title
        let titleFilename = title.replaceAll(/\s/g, '-')
        titleFilename = titleFilename.toLowerCase()
        titleFilename = sanitizeFilename(titleFilename)

        const filename = `${paper.id}-${versionNumber}-${titleFilename}.${mime.getExtension(file.type)}`
        const filepath = 'papers/' + filename

        const newFile = { ...file }
        newFile.filepath = filepath

        // TODO Should moving the file when the file is updated be the
        // responsibility of the FileDAO?  Probably.
        await this.fileService.copyFile(file.filepath, filepath)
        await this.fileDAO.updateFile(newFile)
        await this.fileService.removeFile(file.filepath)
    }


    async updatePartialPaper(paper) {
        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'authors', 'fields', 'versions', 'votes', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE papers SET '
        let params = []
        let count = 1
        for(let key in paper) {
            if (ignoredFields.includes(key)) {
                continue
            }

            if ( key == 'isDraft') {
                sql += 'is_draft = $' + count + ', '
            } else {
                sql += key + ' = $' + count + ', '
            }

            params.push(paper[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count

        params.push(paper.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update paper ${paper.id} with partial update.`) 
        }

    }

    async deletePaper(id) {
        const results = await this.database.query(
            'delete from papers where id = $1',
            [ id ]
        )

        if ( results.rowCount == 0) {
            throw new DAOError('deletion-failed', `Attempt to delete paper(${id}) returned no rows modified.`)
        }

    }

    async refreshPaperScore(id) {
        const results = await this.database.query(`
            UPDATE papers SET ( score ) = ( SELECT COALESCE(SUM(vote), 0) as score FROM responses WHERE paper_id = $1 )
                WHERE papers.id = $1
        `, [ id ] )

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failed', `Attempt to refresh score for Paper(${id}) failed.`)
        }

    }

}
