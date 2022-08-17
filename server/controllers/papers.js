/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/

const PaperDAO = require('../daos/paper.js')
const FieldDAO = require('../daos/field.js')

const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')


/**
 *
 */
module.exports = class PaperController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.paperDAO = new PaperDAO(database, config)
        this.fieldDAO = new FieldDAO(database)
    }


    /**
     * GET /papers
     *
     * Return a JSON array of all papers in the database.
     */
    async getPapers(request, response) {
        let where = 'WHERE'
        const params = []
        let order = ''
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
                where += `${and} papers.id = ANY($${count}::bigint[])`

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
            const results = await this.database.query(`SELECT paper_id from paper_fields where field_id = ANY ($1::bigint[])`, [ fieldIds])
            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                where += `${and} papers.id = ANY($${count}::int[])`

                const paper_ids = []
                for(let row of results.rows) {
                    paper_ids.push(row.paper_id)
                }
                const uniquePaperIds = [ ...new Set(paper_ids) ] 
                params.push(uniquePaperIds)
            } else {
                return response.status(200).json([])
            }
        }

        if ( request.query.excludeFields && request.query.excludeFields.length > 0) {
            const fieldIds = await this.fieldDAO.selectFieldChildren(request.query.excludeFields)
            const results = await this.database.query(`SELECT paper_id from paper_fields where field_id = ANY ($1::bigint[])`, [ fieldIds])
            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                where += `${and} papers.id != ALL($${count}::bigint[])`

                const paper_ids = []
                for(let row of results.rows) {
                    paper_ids.push(row.paper_id)
                }
                const uniquePaperIds = [ ...new Set(paper_ids) ]
                params.push(uniquePaperIds)
            } 
        }

        if ( request.query.searchString && request.query.searchString.length > 0) {
            const results = await this.database.query(`select paper_id from paper_versions where searchable_content @@ websearch_to_tsquery('english', $1) AND is_published=true`, [ request.query.searchString ])
            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )

                const paperIds = results.rows.map((r) => r.paper_id)
                where += `${and} papers.id = ANY($${count}::int[])`
                order += `array_position($${count}::bigint[], papers.id)`
                params.push(paperIds)

            } else {
                return response.status(200).json([])
            }

        }

        if ( request.query.sort ) {
            if ( request.query.sort == 'newest') {
                order = 'papers.created_date desc'
            } else if ( request.query.sort == 'active' ) {
                // TECHDEBT -- Special Snowflake: We need to do a little more
                // work for this one, so we handle it inside `papersDAO.selectPapers`.
                order = 'active'
            }
        }

        // We don't actually have any query parameters.
        if ( count < 1 ) {
            where = ''
        }
        const papers = await this.paperDAO.selectPapers(where, params, order)
        return response.status(200).json(papers)
    }

    /**
     * POST /papers
     *
     * Create a new paper in the database from the provided JSON.
     */
    async postPapers(request, response) {
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `User must be authenticated to submit a paper!`)
        }

        const paper = request.body
        const user = request.session.user

        if ( ! paper.authors.find((a) => a.user.id == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-owner', `User(${user.id}) submitted a paper with out being an owner of that paper!`)
        }

        paper.id = await this.paperDAO.insertPaper(paper) 
        await this.paperDAO.insertAuthors(paper) 
        await this.paperDAO.insertFields(paper)
        await this.paperDAO.insertVersions(paper)

        const returnPapers = await this.paperDAO.selectPapers("WHERE papers.id=$1", [paper.id])
        if ( returnPapers.length > 0 ) {
            return response.status(201).json(returnPapers[0])
        } else {
            throw new ControllerError(500, `server-error`, `Paper ${paper.id} does not exist after insert!`)
        }
    }

    /**
     * GET /paper/:id
     *
     * Get details for a single paper in the database.
     */
    async getPaper(request, response) {
        const papers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [request.params.id])

        if ( papers.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Paper(${request.params.id}) not found.`)
        }

        const paper = papers[0]
        if ( paper.isDraft ) {
            if ( ! request.session.user ) {
                throw new ControllerError(403, 'not-authenticated', `Unauthenticated user attempting to view draft.`)
            }
        }


        return response.status(200).json(paper)
    }

    /**
     * PUT /paper/:id
     *
     * Replace an existing paper wholesale with the provided JSON.
     *
     * NOTE: Intentionally left unimplemented until we have a need for it, or
     * have time to decide how to secure it.
     */
    async putPaper(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to put a paper, when PUT /paper/:id is unimplemented.`)
    }

    /**
     * PATCH /paper/:id
     *
     * Update an existing paper given a partial set of fields in JSON.
     */
    async patchPaper(request, response) {
        const paper = request.body
        // We want to use the params.id over any id in the body.
        paper.id = request.params.id

        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to patch paper(${paper.id}).`)
        }

        const user = request.session.user
        const currentPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [ paper.id ])

        if ( currentPapers.length <= 0) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a paper(${paper.id}) that doesn't exist!`)
        }

        const currentPaper = currentPapers[0]
        if ( ! currentPaper.authors.find((a) => a.user.id == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-owner', `Non-owner user(${user.id}) attempting to PATCH paper(${paper.id}).`)
        }

        await this.paperDAO.updatePartialPaper(paper)

        const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper.id])
        if ( returnPapers.length <= 0 ) {
            throw new ControllerError(500, `server-error`, `Failed to find paper(${paper.id}) after patching!`)
        } 

        return response.status(200).json(returnPapers[0])
    }

    /**
     * DELETE /paper/:id
     *
     * Delete an existing paper.
     */
    async deletePaper(request, response) {
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const user = request.session.user

        const ownerResults = await this.database.query(`
                SELECT user_id, owner FROM paper_authors WHERE user_id = $1 AND owner = true
            `, [ user.id])

        if ( ownerResults.rows.length <= 0 ) {
            throw new ControllerError(403, 'not-owner', `Non-owner user(${user.id}) attempting to delete paper(${request.params.id}).`)
        }
        
        await this.paperDAO.deletePaper(request.params.id)

        return response.status(200).json({paperId: request.params.id})
    }

    async postPaperVersions(request, response) {
        try {
            const paperId = request.params.id
            if ( ! request.session || ! request.session.user ) {
                throw new ControllerError(403, 'not-authorized', `Un-authorized user attempted to submit a new version of Paper(${paperId}).`)
            }
            const version = request.body

            const papers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paperId])
            if ( papers.length <= 0) {
                throw new ControllerError(404, 'not-found', `Attempt to submit a version, but Paper(${paperId}) not found!`)
            }

            const paper = papers[0]

            if ( ! paper.authors.find((a) => a.user.id == request.session.user.id)) {
                throw new ControllerError(403, 'not-authorized', `Un-authorized User(${request.session.user.id}) attempted to submit a new version of Paper(${paper.id}) of which they are not an author.`)
            }

            await this.paperDAO.insertVersion(paper, version)

            const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paper.id ])
            if ( returnPapers.length <= 0) {
                throw new Error(`Paper(${paper.id}) not found after inserting a new version!`)
            }
            return response.status(200).json(returnPapers[0])
        } catch (error) {
            this.logger.error(error)
            if ( error instanceof ControllerError) {
                return response.status(error.status).json({ error: error.type })
            } else if ( error instanceof DAOError) {
                return response.status(500).json({error: 'server-error'})
            } else {
                return response.status(500).json({error: 'server-error'})
            }

        }

    }

    async patchPaperVersion(request, response) {
        let paper_version = request.body

        // We want to use the params.id over any id in the body.
        paper_version.paperId = request.params.paper_id
        paper_version.version = request.params.version

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'paperId', 'version', 'createdDate', 'updatedDate' ]

        

        let sql = 'UPDATE paper_versions SET '
        let params = []
        let count = 1
        for(let key in paper_version) {
            if (ignoredFields.includes(key)) {
                continue
            }

            if ( key == 'isPublished') {
                sql += 'is_published = $' + count + ', '
            } else {
                sql += key + ' = $' + count + ', '
            }

            params.push(paper_version[key])
            count = count + 1
        }

        sql += `updated_date = now() WHERE paper_id = $${count} AND version = $${count+1}`

        params.push(paper_version.paperId, paper_version.version )

        console.log('paper_version')
        console.log(paper_version)
        console.log('sql')
        console.log(sql)
        console.log('params')
        console.log(params)

        try {
            const results = await this.database.query(sql, params)

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
            }

            const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper_version.paperId])
            if ( ! returnPapers ) {
                this.logger.error('Failed to find paper after patching version!')
                return response.status(500).json({ error: 'server-error' })
            } else {
                return response.status(200).json(returnPapers[0])
            }
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'unknown'})
        }

    }

} 
