/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/

const fs = require('fs')
const sanitizeFilename = require('sanitize-filename')
const PaperDAO = require('../daos/paper.js')
const FieldDAO = require('../daos/field.js')


/**
 *
 */
module.exports = class PaperController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.paperDAO = new PaperDAO(database)
        this.fieldDAO = new FieldDAO(database)
    }


    /**
     * GET /papers
     *
     * Return a JSON array of all papers in the database.
     */
    async getPapers(request, response) {
        try {
            let where = 'WHERE'
            const params = []
            let count = 0
            let and = ''

            // Query based on isDraft 
            if ( request.query.isDraft ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                where += `${and} papers.is_draft=$${count}`
                params.push(request.query.isDraft)
            }

            // Query for papers by a certain author (or authors) 
            if ( request.query.authorId ) {
                const results = await this.database.query('SELECT paper_id from paper_authors where user_id=$1', [ request.query.authorId ])
                if ( results.rows.length > 0) {
                    count += 1
                    and = ( count > 1 ? ' AND ' : '' )
                    where += `${and} papers.id = ANY($${count}::int[])`

                    const paper_ids = []
                    for(let row of results.rows) {
                        paper_ids.push(row.paper_id)
                    }
                    params.push(paper_ids)
                } else {
                    return response.status(200).json([])
                }
            }

            // Query for papers tagged with certain fields and their children 
            if ( request.query.fields && request.query.fields.length > 0) {
                const fieldIds = await this.fieldDAO.selectFieldChildren(request.query.fields)
                const results = await this.database.query(`SELECT paper_id from paper_fields where field_id = ANY ($1::int[])`, [ fieldIds])
                if ( results.rows.length > 0) {
                    count += 1
                    and = ( count > 1 ? ' AND ' : '' )
                    where += `${and} papers.id = ANY($${count}::int[])`

                    const paper_ids = []
                    for(let row of results.rows) {
                        paper_ids.push(row.paper_id)
                    }
                    params.push(paper_ids)
                } else {
                    return response.status(200).json([])
                }
            }

            // We don't actually have any query parameters.
            if ( count < 1 ) {
                where = ''
            }
            const papers = await this.paperDAO.selectPapers(where, params)
            return response.status(200).json(papers)
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({ error: 'unknown' })
            return
        }
    }

    /**
     * POST /papers
     *
     * Create a new paper in the database from the provided JSON.
     */
    async postPapers(request, response) {
        const paper = request.body
        console.log(paper)

        try {
            const results = await this.database.query(`
                INSERT INTO papers (title, is_draft, created_date, updated_date) 
                    VALUES ($1, $2, now(), now()) 
                    RETURNING id
                `, 
                [ paper.title, paper.isDraft ]
            )
            if ( results.rows.length == 0 ) {
                this.logger.error('Failed to insert a paper.')
                return response.status(500).json({error: 'unknown'})
            }
            paper.id = results.rows[0].id
            console.log(paper)
            await this.insertAuthors(paper) 
            await this.insertFields(paper)

            const returnPapers = await this.paperDAO.selectPapers("WHERE papers.id=$1", [paper.id])
            if ( returnPapers ) {
                return response.status(201).json(returnPapers[0])
            } else {
                this.logger.error('Paper does not exist after insert.')
                return response.status(500).json({ error: 'server-error' })
            }
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * POST /paper/:id/upload
     *
     * Upload a version of a paper.
     */
    async uploadPaper(request, response) {
        try {
            const titleResults = await this.database.query(`
                SELECT
                    title
                FROM papers
                WHERE id = $1
                `,
                [ request.params.id ]
            )

            if ( titleResults.rows.length == 0 ) {
                this.logger.error('Attempt to upload paper that does not exist.')
                fs.rmSync(request.file.path)
                return response.status(404).json({ error: 'no-paper' })
            }

            const maxVersionResults = await this.database.query(
                'SELECT MAX(version)+1 as version FROM paper_versions WHERE paper_id=$1', 
                [ request.params.id ]
            )
            let version = 1
            if ( maxVersionResults.rows.length > 0 && maxVersionResults.rows[0].version) {
                version = maxVersionResults.rows[0].version
            }

            const versionResults = await this.database.query(`
                INSERT INTO paper_versions
                    (paper_id, version, filepath)
                VALUES
                    ($1, $2, $3)
                RETURNING 
                    paper_id, version, filepath
                `,
                [request.params.id, version, request.file.path]
            )


            if (versionResults.rows.length == 0) {
                this.logger.error('Insert paper version failed silently for ' + paper_id + ' and ' + request.file.path)
                fs.rmSync(request.file.path)
                return response.status(500).json({ error: 'unknown' })
            }

            const title = titleResults.rows[0].title
            let titleFilename = title.replaceAll(/\s/g, '-')
            titleFilename = titleFilename.toLowerCase()
            titleFilename = sanitizeFilename(titleFilename)

            const base = 'public'
            // TODO Properly check the MIME type and require PDF.  Possibly use Node Mime.
            const filename = request.params.id + '-' + version + '-' + titleFilename + '.pdf'
            const filepath = '/uploads/papers/' + filename
            fs.copyFileSync(request.file.path, base+filepath) 

            const updateResults = await this.database.query(`
                UPDATE paper_versions SET
                    filepath = $1
                WHERE paper_id = $2 and version = $3
                `,
                [ filepath, request.params.id, version ]
            )

            if (updateResults.rowCount == 0) {
                this.logger.error('Failed to update paper version with new filepath: ' + filepath)
                fs.rmSync(base + filepath)
                return response.status(500).json({ error: 'failed-filepath-update' })
            }

            fs.rmSync(request.file.path)

            const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [request.params.id])
            if ( ! returnPapers ) {
                this.logger.error('Failed to find paper after upload.')
                return response.status(500).json({ error: 'server-error' })
            } else {
                return response.status(200).json(returnPapers[0])
            }
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({ error: 'unknown' })
        }
    }

    /**
     * GET /paper/:id
     *
     * Get details for a single paper in the database.
     */
    async getPaper(request, response) {
        try {
            const papers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [request.params.id])

            if ( ! papers ) {
                return response.status(404).json({})
            }

            return response.status(200).json(papers[0])
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({ error: 'unknown' })
        }
    }

    /**
     * PUT /paper/:id
     *
     * Replace an existing paper wholesale with the provided JSON.
     *
     * TODO Account for paper_versions
     */
    async putPaper(request, response) {
        try {
            const paper = request.body
            paper.id = request.params.id

            // Update the paper.
            const results = await this.database.query(`
                UPDATE papers 
                    SET title = $1 AND is_draft=$2 AND updated_date = now() 
                WHERE id = $3 
                `,
                [ paper.title, paper.isDraft, paper.id ]
            )

            if (results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
            }

            // Delete the authors so we can recreate them from the request.
            const authorDeletionResults = await this.database.query(`
                DELETE FROM paper_authors WHERE paper_id = $1
                `,
                [ paper.id ]
            )

            const fieldDeletionResults = await this.database.query(`
                DELETE FROM paper_fields WHERE paper_id = $1
                `,
                [ paper.id ]
            )

            // Reinsert the authors.
            await this.insertAuthors(paper)
            await this.insertFields(paper)

            const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper.id])
            if ( ! returnPapers ) {
                this.logger.error('Failed to find modified paper.')
                return response.status(500).json({ error: 'server-error' })
            } else {
                return response.status(200).json(returnPapers[0])
            }
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * PATCH /paper/:id
     *
     * Update an existing paper given a partial set of fields in JSON.
     */
    async patchPaper(request, response) {
        let paper = request.body

        // We want to use the params.id over any id in the body.
        paper.id = request.params.id

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'authors', 'fields', 'versions', 'createdDate', 'updatedDate' ]

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

        try {
            const results = await this.database.query(sql, params)

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
            }

            const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper.id])
            if ( ! returnPapers ) {
                this.logger.error('Failed to find patched paper!')
                return response.status(500).json({ error: 'server-error' })
            } else {
                return response.status(200).json(returnPapers[0])
            }
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /paper/:id
     *
     * Delete an existing paper.
     */
    async deletePaper(request, response) {
        try {
            const results = await this.database.query(
                'delete from papers where id = $1',
                [ request.params.id ]
            )

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'})
            }

            return response.status(200).json({paperId: request.params.id})
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({error: 'unknown'})
        }
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
            throw new Error('Something went wrong with the author insertion.')
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
            throw new Error('Something went wrong with field insertion.')
        }
    }
} 
