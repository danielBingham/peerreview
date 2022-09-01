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
     * Takes a query object generated from the query string and creates an SQL
     * `WHERE` clause, `ORDER` clause, and parameters array.  Also handle
     * pagination.
     *
     * @param {Object}  query    The query object we get from the query string.
     * @param {boolean} query.isDraft   (Optional) A boolean indicating whether
     * we're selecting drafts or published papers.
     * @param {integer} query.authorId  (Optional) The id of an author who's papers
     * we wish to query for.
     * @param {integer[]} query.fields  (Optional) An array of fields we want to
     * restrict the paper query to.
     * @param {integer[]} query.excludeFields   (Optional) An array of fields we
     * want to exclude from the query.
     * @param {string}  query.searchString  (Optional) A string of text we want to
     * search in paper bodies and titles for.
     * @param {string}  query.sort  (Optional) The sort we want to apply to our query.
     * @param {integer} query.page  (Optional) The page we wish to return.
     * @param {Object} options  (Optional) An optional options object with
     * settings to tweak our parsing.
     * @param {boolean} options.ignoreOrder (Optional) Ignore the order clause.
     *
     * @return {Object} Returns an object with the following structure:
     * ```
     * { 
     *  where: '', // The WHERE clause
     *  order: '', // the ORDER clause
     *  params: [], // An array of paramters matching the `$N` parameterization
     *  // markers in the where and order clauses.
     *  }
     */
    async parseQuery(query, options) {
        options =  options || {
            ignoreOrder: false,
            ignorePage: false
        }

        const result = {
            where: '',
            params: [],
            order: '',
            emptyResult: false
        }

        let count = 0
        let and = ''


        // Add `is_draft` to our query to determine whether we're getting
        // drafts or published papers.
        //
        // Adds a single boolean check against `papers.is_draft`
        if ( query.isDraft ) {
            count += 1
            and = ( count > 1 ? ' AND ' : '' )
            result.where += `${and} papers.is_draft=$${count}`
            result.params.push(query.isDraft)
        }


        // Query for papers by a certain author.  Currently we're only taking a
        // single integer for `authorId`, so we can only query for a single
        // author in each query.
        //
        // Generates an array of paperIds and compares `papers.id` against the
        // array.
        if ( query.authorId ) {
            const results = await this.database.query('SELECT paper_id from paper_authors WHERE user_id=$1', [ query.authorId ])
            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} papers.id = ANY($${count}::bigint[])`

                const paper_ids = []
                for(let row of results.rows) {
                    paper_ids.push(row.paper_id)
                }
                result.params.push(paper_ids)
            } else {
                result.emptyResult = true
                return result
            }
        }


        // Query for papers tagged with certain fields and their children.
        // These are the fields to limit the query to, in other words a paper
        // will only be included in the query if it is tagged with one of these
        // fields (or its children).
        //
        // Generates an array of paperIds and compares `papers.id` against the
        // array.
        if ( query.fields && query.fields.length > 0) {
            const fieldIds = await this.fieldDAO.selectFieldChildren(query.fields)
            const results = await this.database.query(`SELECT paper_id from paper_fields WHERE field_id = ANY ($1::bigint[])`, [ fieldIds])
            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} papers.id = ANY($${count}::int[])`

                const paper_ids = []
                for(let row of results.rows) {
                    paper_ids.push(row.paper_id)
                }
                const uniquePaperIds = [ ...new Set(paper_ids) ] 
                result.params.push(uniquePaperIds)
            } else {
                result.emptyResult = true
                return result
            }
        }

        // Exclude any papers tagged with these fields or their children from
        // the search.
        //
        // Generates an array of paperIds and compares `papers.id` against the
        // array.
        if ( query.excludeFields && query.excludeFields.length > 0) {
            const fieldIds = await this.fieldDAO.selectFieldChildren(query.excludeFields)
            const results = await this.database.query(`SELECT paper_id from paper_fields WHERE field_id = ANY ($1::bigint[])`, [ fieldIds])
            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} papers.id != ALL($${count}::bigint[])`

                const paper_ids = []
                for(let row of results.rows) {
                    paper_ids.push(row.paper_id)
                }
                const uniquePaperIds = [ ...new Set(paper_ids) ]
                result.params.push(uniquePaperIds)
            } 
        }

        // Search the content of the paper for a particular string.
        //
        // Generates an array of paperIds and compares `papers.id` against the
        // array.
        if ( query.searchString && query.searchString.length > 0) {
            const results = await this.database.query(`select paper_id from paper_versions WHERE searchable_content @@ websearch_to_tsquery('english', $1) AND is_published=true`, [ query.searchString ])
            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )

                const paperIds = results.rows.map((r) => r.paper_id)
                result.where += `${and} papers.id = ANY($${count}::int[])`
                result.order += `array_position($${count}::bigint[], papers.id)`
                result.params.push(paperIds)

            } else {
                result.emptyResult = true
                return result
            }
        }


        // Generate an `ORDER` clause.  
        //
        // If `options.ignoreOrder` then we skip this step.
        //
        // TECHDEBT In the case of 'active' ordering, we need to pass it
        // through to the DAO, because that requires additional joins.
        if ( query.sort && ! options.ignoreOrder ) {
            if ( query.sort == 'newest') {
                result.order = 'papers.created_date desc'
            } else if ( query.sort == 'active' ) {
                // TECHDEBT -- Special Snowflake: We need to do a little more
                // work for this one, so we handle it inside `papersDAO.selectPapers`.
                if ( query.isDraft == true) {
                    result.order = 'draft-active'
                } else {
                    result.order = 'published-active'
                }
            } else {
                // Default ordering is by newest.
                result.order = 'papers.created_date desc'
            }
        }

        // Handle paging.
        //
        // Generates an array of paperIds representing the papers that should
        // appear on the current page and compares `papers.id` to it.
        if ( query.page && ! options.ignorePage ) {
            const where = ( result.where.length > 0 ? `WHERE ${result.where}` : '')
            const paperIds = await this.paperDAO.getPage(where, result.params, result.order, query.page)
            if ( paperIds.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '')

                result.where += `${and} papers.id = ANY($${count}::int[])`
                result.params.push(paperIds)
            } else {
                result.emptyResult = true
                return result 
            }
        }

        // If we do have a where clause at this point, put 'WHERE' where 
        if ( result.where.length > 0) {
            result.where = `WHERE ${result.where}` 
        }


        return result
    }

    /**
     * GET /papers/count
     *
     * Return an object with counts of papers, pages, and page size.
     */
    async countPapers(request, response) {
        const { where, params, emptyResult } = await this.parseQuery(request.query, { ignoreOrder: true, ignorePage: true })

        if ( emptyResult ) {
            return response.status(200).json({
                count: 0,
                pageSize: 1,
                numberOfPages: 1
            })
        }

        const countResult = await this.paperDAO.countPapers(where, params)
        return response.status(200).json(countResult)
    }

    /**
     * GET /papers
     *
     * Return a JSON array of all papers in the database.
     */
    async getPapers(request, response) {
        const { where, params, order, emptyResult } = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json([])
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
