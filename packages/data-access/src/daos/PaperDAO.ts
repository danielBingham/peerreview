/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Pool, QueryResultRow } from 'pg'

import { Paper, PaperAuthor, PaperVersion, ModelDictionary, QueryMeta } from '@journalhub/model'

import { Core, DAOError } from '@journalhub/core'

import { DAOQuery, DAOQueryOrder, DAOResult } from '../types/DAO'

import { FileDAO } from './FileDAO'

const PAGE_SIZE = 50 

/**
 * Data Access Object for mapping the `Paper` type (defined in
 * @journalhub/model) to and from the database.
 */
export class PaperDAO {
    
    /** Number of results on each page. **/
    PAGE_SIZE: number

    /** The database connection to use for querying the database. **/
    database: Pool

    fileDAO: FileDAO

    constructor(core: Core) {
        this.PAGE_SIZE = PAGE_SIZE

        this.database = core.database
        this.fileDAO = new FileDAO(core)
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     */
    hydratePapers(rows: QueryResultRow[]): DAOResult<Paper>  {
        const dictionary: ModelDictionary<Paper> = {}
        const list: number[] = []

        // These are just used to track the various child objects and ensure
        // uniqueness.
        const authorDictionary: { [paperId: number]: { [ authorId: number]: PaperAuthor }} = {}
        const versionDictionary: { [paperId: number]: { [versionId: number]:  PaperVersion }} = {}
        const fieldDictionary: { [paperId: number]: { [fieldId: number]: boolean }} = {}

        for(const row of rows) {
            if ( ! (row.Paper_id in dictionary ) ){
                const paper: Paper = { 
                    id: row.Paper_id,
                    title: row.Paper_title,
                    isDraft: row.Paper_isDraft,
                    showPreprint: row.Paper_showPreprint,
                    score: row.Paper_score,
                    createdDate: row.Paper_createdDate,
                    updatedDate: row.Paper_updatedDate,
                    authors: [],
                    versions: [],
                    fields: []
                }

                dictionary[paper.id] = paper
                list.push(paper.id)
            }

            if ( row.PaperAuthor_userId ) {
                if ( ! (row.Paper_id in authorDictionary) ) {
                    authorDictionary[row.Paper_id] = {}
                }

                if ( ! (row.PaperAuthor_userId in authorDictionary[row.Paper_id])) {
                    const paperAuthor: PaperAuthor = {
                        userId : row.PaperAuthor_userId,
                        order: row.PaperAuthor_order,
                        owner: row.PaperAuthor_owner,
                        submitter: row.PaperAuthor_submitter,
                        role: row.Role_name
                    }

                    authorDictionary[row.Paper_id][paperAuthor.userId] = paperAuthor 
                    dictionary[row.Paper_id].authors.push(paperAuthor)
                }
            }

            if ( row.PaperVersion_version ) {
                if ( ! (row.Paper_id in versionDictionary)) {
                    versionDictionary[row.Paper_id] = {}
                }

                if ( ! (row.PaperVersion_version in versionDictionary[row.Paper_id])) {
                    const paperVersion: PaperVersion = { 
                        version: row.PaperVersion_version,
                        file: this.fileDAO.hydrateFile(row),
                        content: row.PaperVersion_content,
                        reviewCount: row.PaperVersion_reviewCount,
                        createdDate: row.PaperVersion_createdDate,
                        updatedDate: row.PaperVersion_updatedDate
                    }

                    versionDictionary[row.Paper_id][paperVersion.version] = paperVersion
                    dictionary[row.Paper_id].versions.push(paperVersion)
                }
            }

            if ( row.PaperField_fieldId ) {
                if ( ! (row.Paper_id in fieldDictionary)) {
                    fieldDictionary[row.Paper_id] = {}
                }

                if ( ! (row.PaperField_fieldId in fieldDictionary[row.Paper_id])) {
                    fieldDictionary[row.Paper_id][row.PaperField_fieldId] = true
                    dictionary[row.Paper_id].fields.push(row.PaperField_fieldId)
                }
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Select papers from the database, along with all of the data necessary to
     * populate the `paper` object.  Uses a large join to pull all the
     * necessary data from across multiple tables.
     */
    async selectPapers(query?: DAOQuery): Promise<DAOResult<Paper>> {
        let where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : []

        let order = 'papers.created_date desc'

        // TECHDEBT - Definitely not the ideal way to handle this.  But so it goes.
        let activeOrderJoins = ''
        if ( query?.order == DAOQueryOrder.MostActive ) {
            activeOrderJoins = `
                LEFT OUTER JOIN reviews ON reviews.paper_id = papers.id AND reviews.status != 'in-progress'
                LEFT OUTER JOIN review_comment_threads ON review_comment_threads.review_id = reviews.id
                LEFT OUTER JOIN review_comments ON review_comments.thread_id = review_comment_threads.id AND review_comments.status != 'in-progress'
            `
            order = 'greatest(paper_versions.updated_date, reviews.updated_date, review_comments.updated_date) DESC NULLS LAST, '
        } else if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'papers.created_date desc'
        }

        const sql = `
               SELECT 

                    papers.id as "Paper_id", papers.title as "Paper_title", papers.is_draft as "Paper_isDraft",
                    papers.score as "Paper_score", papers.show_preprint as "Paper_showPreprint",
                    papers.created_date as "Paper_createdDate", papers.updated_date as "Paper_updatedDate",

                    paper_authors.user_id as "PaperAuthor_userId", paper_authors.author_order as "PaperAuthor_order",
                    paper_authors.owner as "PaperAuthor_owner", paper_authors.submitter as "PaperAuthor_submitter",

                    paper_versions.version as "PaperVersion_version",
                    paper_versions.content as "PaperVersion_content", paper_versions.review_count as "PaperVersion_reviewCount",
                    paper_versions.created_date as "PaperVersion_createdDate", paper_versions.updated_date as "PaperVersion_updatedDate",

                    ${ this.fileDAO.getFilesSelectionString() },

                    paper_fields.field_id as "PaperField_fieldId",

                    roles.id as "Role_id", roles.name as "Role_name", 

                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN user_roles ON paper_authors.user_id = user_roles.user_id
                    LEFT OUTER JOIN roles ON user_roles.role_id = roles.id AND papers.id = roles.paper_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                    LEFT OUTER JOIN files on paper_versions.file_id = files.id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    ${activeOrderJoins}
                ${where} 
                ORDER BY ${order}paper_authors.author_order asc, paper_versions.version desc
        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return { dictionary: {}, list: [] } 
        } else {
            return this.hydratePapers(results.rows)
        }
    }

    /**
     * Get an array containing the id numbers of papers for a particular page
     * of a query.
     *
     * @param {string} where (Optional) The `WHERE` statement of the SQL query.
     * @param {any[]} params (Optional) The parameters for the parameterized `WHERE` statement defined in `where`.
     * @param {string} order (Optional) An `ORDER` statement for the query.
     * @param {number} page (Optional) The number of the page of results we want to retrieve.
     *
     * @return {Promise<number[]>} An array of `paper.id` numbers corresponding
     * to the papers on the requested page of the query.
     */
    async getPage(query?: DAOQuery): Promise<number[]> {
        let where = (query?.where && query.where.length ? `WHERE ${query.where}` : '')
        const params = (query?.params && query.params.length ? [...query.params] : [])
        
        let page = query?.page || 1
        let itemsPerPage = query?.itemsPerPage || PAGE_SIZE

        let order = 'papers.created_date desc'

        // TECHDEBT - Definitely not the ideal way to handle this.  But so it goes.
        let activeOrderJoins = ''
        let activeOrderFields = ''
        if ( query?.order == DAOQueryOrder.MostActive ) {
            activeOrderJoins = `
                LEFT OUTER JOIN reviews ON reviews.paper_id = papers.id AND reviews.status != 'in-progress'
                LEFT OUTER JOIN review_comment_threads ON review_comment_threads.review_id = reviews.id
                LEFT OUTER JOIN review_comments ON review_comments.thread_id = review_comment_threads.id AND review_comments.status != 'in-progress'
            `
            activeOrderFields = ', greatest(max(paper_versions.updated_date), max(reviews.updated_date), max(review_comments.updated_date)) as activity_date'
            order = 'activity_date DESC NULLS LAST, papers.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'papers.created_date desc'
        }

        params.push(itemsPerPage)
        params.push((page-1)*itemsPerPage)
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
    async countPapers(query?: DAOQuery): Promise<QueryMeta> {
        let where = (query?.where ? `WHERE ${query.where}` : '')
        const params = (query?.params ? [...query.params] : [])

        let page = query?.page || 1
        let itemsPerPage = query?.itemsPerPage || PAGE_SIZE

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
                page: page,
                pageSize: itemsPerPage,
                numberOfPages: 1
            }
        }

        const count = parseInt(results.rows[0].paper_count)
        return { 
            count: count,
            page: page,
            pageSize: itemsPerPage,
            numberOfPages: Math.floor(count / itemsPerPage) + ( count % itemsPerPage > 0 ? 1 : 0)
        }
    }

    /**
     *
     */
    async insertPaper(paper: Paper): Promise<number> {
        const results = await this.database.query(`
                INSERT INTO papers (title, is_draft, show_preprint, created_date, updated_date) 
                    VALUES ($1, $2, $3, now(), now()) 
                    RETURNING id
                `, 
            [ paper.title, paper.isDraft, paper.showPreprint ]
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
    async insertAuthors(paper: Paper): Promise<void> {
        let sql =  `INSERT INTO paper_authors (paper_id, user_id, author_order, owner, submitter) VALUES `
        let params = []

        let count = 1
        let authorCount = 1
        for (const author of paper.authors) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3}, $${count+4})` + (authorCount < paper.authors.length ? ', ' : '')
            params.push(paper.id, author.userId, author.order, author.owner, author.submitter)
            count = count+5
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
    async insertFields(paper: Paper): Promise<void> {
        if ( ! paper.fields ) {
            return
        }

        let sql = `INSERT INTO paper_fields (field_id, paper_id) VALUES `
        let params: any = []

        let count = 1
        let fieldCount = 1
        for (const fieldId of paper.fields) {
            sql += `($${count}, $${count+1})` + (fieldCount < paper.fields.length ? ', ' : '')
            params.push(fieldId, paper.id)
            count = count+2
            fieldCount++
        }

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0) {
            throw new DAOError('failed-insertion', 'Something went wrong with field insertion.')
        }
    }

    async insertVersion(paper: Paper, version: PaperVersion): Promise<void> {
        const maxVersionResults = await this.database.query(
            'SELECT MAX(version)+1 as version FROM paper_versions WHERE paper_id=$1', 
            [ paper.id ]
        )
        version.version = 1
        if ( maxVersionResults.rows.length > 0 && maxVersionResults.rows[0].version) {
            version.version = maxVersionResults.rows[0].version
        }

        const versionResults = await this.database.query(`
            INSERT INTO paper_versions (paper_id, version, file_id, content, created_date, updated_date)
                VALUES ($1, $2, $3, $4, now(), now())
        `, [ paper.id, version.version, version.file.id, version.content ])

        if ( versionResults.rowCount === null || versionResults.rowCount <= 0) {
            throw new DAOError('failed-insertion', `Failed to insert version for paper ${paper.id} and file ${version.file.id}.`)
        }
    }

    async updatePartialPaper(paper: Paper): Promise<void> {
        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'authors', 'fields', 'versions', 'votes', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE papers SET '
        let params: any = []
        let count = 1
        for(let key of Object.keys(paper)) {
            if (ignoredFields.includes(key)) {
                continue
            }

            if ( key == 'isDraft') {
                sql += `is_draft = $${count}, `
            } else if ( key == 'showPreprint' ) {
                sql += `show_preprint = $${count}, `
            } else {
                sql += key + ' = $' + count + ', '
            }

            params.push(paper[key as keyof Paper])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count

        params.push(paper.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount == null || results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update paper ${paper.id} with partial update.`) 
        }

    }

    async deletePaper(id: number): Promise<void> {
        const results = await this.database.query(
            'delete from papers where id = $1',
            [ id ]
        )

        if ( results.rowCount == 0) {
            throw new DAOError('deletion-failed', `Attempt to delete paper(${id}) returned no rows modified.`)
        }

    }

    async refreshPaperScore(id: number): Promise<void> {
        const results = await this.database.query(`
            UPDATE papers SET ( score ) = ( SELECT COALESCE(SUM(vote), 0) as score FROM responses WHERE paper_id = $1 )
                WHERE papers.id = $1
        `, [ id ] )

        if ( results.rowCount == null || results.rowCount <= 0 ) {
            throw new DAOError('update-failed', `Attempt to refresh score for Paper(${id}) failed.`)
        }

    }

}
