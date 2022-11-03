/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/

const PaperDAO = require('../daos/paper.js')
const FieldDAO = require('../daos/field.js')

const ReputationPermissionService = require('../services/ReputationPermissionService')

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
        this.reputationPermissionService = new ReputationPermissionService(database, logger)
    }

    /**
     * Helper method.
     *
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
    async parseQuery(session, query, options) {
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


        // If we're not intentionally retrieving drafts then we're getting
        // published papers.
        //
        // If we are intentionally getting drafts, make sure we only return the
        // drafts that a user has permission to see.
        if (query.isDraft && query.isDraft.toLowerCase() === 'true' ) {
            if ( ! session.user ) {
                result.emptyResult = true
                return result
            }

            count += 1
            and = ( count > 1 ? ' AND ' : '' )

            const visibleIds = await this.reputationPermissionService.getVisibleDrafts(session.user.id)

            result.where += `${and} papers.id = ANY($${count}::bigint[])`
            result.params.push(visibleIds)
        } else {
            count += 1
            and = ( count > 1 ? ' AND ' : '' )
            result.where += `${and} papers.is_draft = $${count}`
            result.params.push(false)
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
            const fieldIds = await this.fieldDAO.selectFieldDescendents(query.fields)
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
            const fieldIds = await this.fieldDAO.selectFieldDescendents(query.excludeFields)
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
            const results = await this.database.query(`
                SELECT 
                   id 
                FROM papers
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                WHERE is_published=true AND 
                    ( paper_versions.searchable_content @@ websearch_to_tsquery('english', $1) OR
                        papers.searchable_title @@ websearch_to_tsquery('english', $1) )
            `, [ query.searchString ])

            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )

                const paperIds = results.rows.map((r) => r.id)
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
     *
     * TODO This is techdebt.  Merge it with getPapers() and use the
     * meta/result response format.
     */
    async countPapers(request, response) {
        /** 
         * parseQuery() handles the permissions by only selecting papers the
         * user is allowed to view. 
         */
        const { where, params, emptyResult } = await this.parseQuery(request.session, request.query, { ignoreOrder: true, ignorePage: true })

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
     * Responds with a JSON array of papers match request.query.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.query    The query object we get from the query string.
     * @param {boolean} request.query.isDraft   (Optional) A boolean indicating whether
     * we're selecting drafts or published papers.
     * @param {integer} request.query.authorId  (Optional) The id of an author who's papers
     * we wish to query for.
     * @param {integer[]} request.query.fields  (Optional) An array of fields we want to
     * restrict the paper query to.
     * @param {integer[]} request.query.excludeFields   (Optional) An array of fields we
     * want to exclude from the query.
     * @param {string}  request.query.searchString  (Optional) A string of text we want to
     * search in paper bodies and titles for.
     * @param {string}  request.query.sort  (Optional) The sort we want to apply to our query.
     * @param {integer} request.query.page  (Optional) The page we wish to return.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getPapers(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User logged in => May get published papers and drafts user has
         * `review` permissions for.
         * 2. User not logged in => May only get published papers.
         *
         * These constraints are enforced in `PaperController::buildQuery()`.
         * 
         * ********************************************************************/

        /** 
         * parseQuery() handles the permissions by only selecting papers the
         * user is allowed to view. 
         */
        const { where, params, order, emptyResult } = await this.parseQuery(request.session, request.query)

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
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `paper` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postPapers(request, response) {
        const paper = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. User is an author and owner of the paper being submitted.
         * 3. At least one of the authors has enough reputation to publish in
         *      each of the fields the paper is tagged with.
         *
         * Data validation:
         *
         * 4. Paper has at least 1 valid author.
         * 5. Paper has at least 1 valid field.
         * 6. Paper has at least 1 valid file.
         * 7. File cannot be associated with any other papers.
         * 
         * **********************************************************/

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to submit a paper!`)
        }

        const user = request.session.user

        // 2. User is an author and owner of the paper being submitted.
        if ( ! paper.authors.find((a) => a.user.id == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `User(${user.id}) submitted a paper with out being an owner of that paper!`)
        }

        // 3. At least one of the authors has enough reputation to publish in
        // each of the fields the paper is tagged with.
        const { canPublish, missingFields } = await this.reputationPermissionService.canPublish(user.id, paper) 
        if ( ! canPublish ) {
            throw new ControllerError(403, 'not-authorized:reputation',
                `User(${user.id}) submitted a paper to fields they are not authorized to publish in.`, {
                    missingFields: missingFields
                })
        }

        // 4. Paper has at least 1 valid author.
        if ( paper.authors.length < 1 ) {
            throw new ControllerError(400, 'no-authors',
                `User(${user.id}) submitted a paper with out any authors.`)
        }

        const authorIds = paper.authors.map((a) => a.user.id)
        const authorResults = await this.database.query(`
            SELECT DISTINCT users.id FROM users WHERE users.id = ANY($1::bigint[])
        `, [ authorIds ])


        if ( authorResults.rows.length != authorIds.length) {
            for ( const authorId of authorIds ) {
                if ( ! authorResults.rows.find((row) => row.id == authorId) ) {
                    throw new ControllerError(400, `invalid-author`,
                        `User(${user.id}) submitted a paper with invalid Author(${authorId}).`, {
                            authorId: authorId
                        })
                }
            }
            throw new ControllerError(400, 'invalid-author',
                `User(${user.id}) submitted a paper with at least one invalid author or with duplicate authors.`)
        }

        // 5. Paper has at least 1 valid field.
        if ( paper.fields.length < 1 ) {
            throw new ControllerError(400, 'no-fields',
                `User(${user.id}) submitted a paper with no fields.`)
        }
        
        const fieldIds = paper.fields.map((f) => f.id)
        const fieldResults = await this.database.query(`
            SELECT DISTINCT fields.id FROM fields WHERE fields.id = ANY($1::bigint[])
        `, [ fieldIds ])

            
        if ( fieldResults.rows.length != fieldIds.length ) {
            for ( const fieldId of fieldIds ) {
                if ( ! fieldResults.rows.find((f) => f.id == fieldId)) {
                    throw new ControllerError(400, `invalid-field:${fieldId}`,
                        `User(${user.id}) submitted a paper with invalid Field(${fieldId}).`)
                }
            }
            throw new ControllerError(400, `invalid-field`,
                `User(${user.id}) submitted a paper with at least one invalid field.`)
        }

        // 6. Paper has at least 1 valid file.
        if ( paper.versions.length < 1 ) {
            throw new ControllerError(400, `no-versions`,
                `User(${user.id}) submitted a paper with no versions.`)
        }

        const fileIds = paper.versions.map((v) => v.file.id)
        const fileResults = await this.database.query(`
            SELECT DISTINCT files.id FROM files WHERE files.id = ANY($1::uuid[])
        `, [ fileIds ])

        if ( fileResults.rows.length != fileIds.length ) {
            for ( fileId of fileIds ) {
                if ( ! fileResults.rows.find((f) => f.id == fileId) ) {
                    throw new ControllerError(400, `invalid-file:${fileId}`,
                        `User(${user.id}) submitted a paper with an invalid File(${fileId}).`)
                }
            }
            throw new ControllerError(400, `invalid-file`,
                `User(${user.id}) submitted a paper with at least one invalid file.`)
        }

        // 7. Files cannot be associated with any other papers.
        const fileConflictResults = await this.database.query(`
            SELECT paper_versions.paper_id, paper_versions.file_id FROM paper_versions WHERE paper_versions.file_id = ANY($1::uuid[])
        `, [ fileIds ])
        if ( fileConflictResults.rows.length > 0 ) {
            throw new ControllerError(400, `file-in-use`,
                `Files can only be attached to a single paper.`)
        }

        /********************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST
         ********************************************************/
        
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
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the paper we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getPaper(request, response) {
        const papers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [request.params.id])

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. If the paper is a draft, user must be logged in and have review
         * privileges on that draft.
         * 
         * **********************************************************/

        if ( papers.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Paper(${request.params.id}) not found.`)
        }

        const paper = papers[0]
        if ( paper.isDraft ) {
            if ( ! request.session.user ) {
                throw new ControllerError(403, 'not-authenticated', `Unauthenticated user attempting to view draft.`)
            }

            // If it's a draft, they have to have canReview permission to even
            // see it.
            const canReview = await this.reputationPermissionService.canReview(request.session.user.id, paper.id) 
            if ( ! canReview ) {
                throw new ControllerError(404, 'no-resource',
                    `User(${user.id}) attempting to view Paper(${paper.id}) they don't have permission to review.`)
            }

        }

        /************************************************************
         * Permissions Checking Complete
         *      Return the Paper
         ************************************************************/

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
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the paper we wish to
     * patch.
     * @param {Object} request.body The paper patch - a paper object with only
     * partial data that will be used to update only those parts of the paper
     * in the database.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchPaper(request, response) {
        const paper = request.body
        // We want to use the params.id over any id in the body.
        paper.id = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 5. Only title and isDraft may be patched.
         * 
         * **********************************************************/

        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', `Unauthenticated user attempting to patch paper(${paper.id}).`)
        }

        const user = request.session.user

        const currentPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [ paper.id ])

        // 2. Paper(:paper_id) must exist.
        if ( currentPapers.length <= 0) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a paper(${paper.id}) that doesn't exist!`)
        }

        const currentPaper = currentPapers[0]

        // 3. User must be an owning author on the Paper(:paper_id)
        if ( ! currentPaper.authors.find((a) => a.user.id == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `Non-owner user(${user.id}) attempting to PATCH paper(${paper.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! currentPaper.isDraft ) {
            throw new ControllerError(403, `not-authorized:published`,
                `User(${user.id}) attempting to PATCH a published paper.`)
        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the Paper.
         ********************************************************/

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
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the paper we wish to
     * delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deletePaper(request, response) {
        const paperId = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 
         * **********************************************************/
        
        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const user = request.session.user

        const existingResults = await this.database.query(`
                SELECT paper_authors.user_id, paper_authors.owner, papers.is_draft as "isDraft"
                FROM papers
                    JOIN paper_authors on papers.id = paper_authors.paper_id
                WHERE papers.id = $1 AND paper_authors.user_id = $2 AND owner = true
            `, [ paperId, user.id])

        // 2. Paper(:paper_id) must exist.
        // 3. User must be an owning author on Paper(:paper_id)
        if ( existingResults.rows.length <= 0 ) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner user(${user.id}) attempting to delete paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! existingResults.rows[0].isDraft ) {
            throw new ControllerError(403, 'not-authorized:not-draft',
                `User(${user.id}) attempting to delete published Paper(${paperId}).`)
        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      DELETE the Paper.
         ********************************************************/
        
        await this.paperDAO.deletePaper(request.params.id)

        return response.status(200).json({paperId: request.params.id})
    }

    /**
     * POST /papers/:paper_id/versions
     *
     * Add a new version to an existing paper.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we
     * wish to add a version to.
     * @param {Object} request.body The paper_version we're adding to
     * Paper(:paper_id).
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postPaperVersions(request, response) {
        const paperId = request.params.paper_id
        const version = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 5. File(version.file.id) must be a valid file.
         * 6. File(verison.file.id) must not be attached to any other paper.
         * 
         * **********************************************************/
        
        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const user = request.session.user

        const papers = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])

        // 2. Paper(:paper_id) must exist.
        if ( papers.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `User(${user.id}) attempted to post a new version of a paper that doesn't exist.`)
        }

        const paper = papers[0]

        // 3. User must be an owning author on Paper(:paper_id)
        if ( ! paper.authors.find((a) => a.user.id == user.id && a.owner)) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner user(${user.id}) attempting to delete paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! paper.isDraft ) {
            throw new ControllerError(403, 'not-authorized:not-draft',
                `User(${user.id}) attempting to delete published Paper(${paperId}).`)
        }

        const fileResults = await this.database.query(`
            SELECT files.id, paper_versions.version
                FROM files
                    LEFT OUTER JOIN paper_versions on files.id = paper_versions.file_id
                WHERE files.id = $1
        `, [ version.file.id ])

        // 5. File(verison.file.id) must be a valid file.
        if ( fileResults.rows.length <= 0) {
            throw new ControllerError(400, 'file-not-found',
                `User(${user.id}) attempted to create a new version for Paper(${paperId}) with invalid File(${version.file.id}).`)
        }

        // 6. File(version.file.id) must not be attached to any other paper.
        if ( fileResults.rows[0].version ) {
            throw new ControllerError(400, 'file-in-use',
                `User(${user.id}) attempted to attach File(${version.file.id}) to a second paper.`)

        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      POST the new version.
         ********************************************************/

        await this.paperDAO.insertVersion(paper, version)

        const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paper.id ])
        if ( returnPapers.length <= 0) {
            throw new ControllerError(500, 'server-error', `Paper(${paper.id}) not found after inserting a new version!`)
        }
        return response.status(200).json(returnPapers[0])
    }

    /**
     * NOT IMPLEMENTED
     *
     * PATCH /papers/:paper_id/version/:version
     *
     * Update an existing version on a paper.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper in question.
     * @param {int} request.params.version The version of that paper we want to patch.
     * @param {Object} request.body The partial paper_version object that will be used to update the paper_verison.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchPaperVersion(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to call unimplemented PATCH version.`)

        /*let paper_version = request.body
        const paperId = request.params.paper_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 5. PaperVersion(:version) must exist.
         * 
         * **********************************************************
        
        // We want to use the params.id over any id in the body.
        //
        // @TODO check these for mismatch and throw an error instead of
        // overriding.
        paper_version.paperId = request.params.paper_id
        paper_version.version = request.params.version

        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const user = request.session.user

        const papers = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])

        // 2. Paper(:paper_id) must exist.
        if ( papers.length <= 0) {
            throw new ControllerError(404, 'not-found',
                `User(${user.id}) attempted to patch a version of Paper(${paperId}), but it didn't exist!`)
        }

        const paper = papers[0]

        // 3. User must be an owning author on Paper(:paper_id)
        if ( ! paper.authors.find((a) => a.user.id == user.id && a.owner)) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner user(${user.id}) attempting to PATCH Paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! paper.isDraft ) {
            throw new ControllerError(403, 'not-authorized:not-draft',
                `User(${user.id}) attempting to delete published Paper(${paperId}).`)
        }

        // 5. PaperVersion(:version) must exist.
        if ( ! paper.versions.find((v) => v.version == paper_version.version) ) {
            throw new ControllerError(404, 'version-not-found',
                `User(${user.id}) attempted to patch Version(${paper_version.version}) on Paper(${paperId}), but it didn't exist!`)
        }


        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the version.
         ********************************************************

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'paperId', 'version', 'file', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE paper_versions SET '
        let params = []
        let count = 1
        for(let key in paper_version) {
            if (ignoredFields.includes(key)) {
                continue
            }

            sql += key + ' = $' + count + ', '

            params.push(paper_version[key])
            count = count + 1
        }

        sql += `updated_date = now() WHERE paper_id = $${count} AND version = $${count+1}`

        params.push(paper_version.paperId, paper_version.version )

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new ControllerError(404, 'no-resource', `Paper(${paper.id}) and Version(${paper_version.version}) not found!`)
        }

        const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper_version.paperId])
        if ( ! returnPapers ) {
            throw new ControllerError(500, 'server-error', `Paper(${paper.id}) not found after inserting a new version!`)
        } 
        return response.status(200).json(returnPapers[0])*/
    }

} 
