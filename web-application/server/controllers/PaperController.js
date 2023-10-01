/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/

const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

/**
 *
 */
module.exports = class PaperController {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger

        this.paperDAO = new backend.PaperDAO(core)
        this.fieldDAO = new backend.FieldDAO(core)
        this.userDAO = new backend.UserDAO(core)
        this.journalDAO = new backend.JournalDAO(core)
        this.journalSubmissionDAO = new backend.JournalSubmissionDAO(core)

        this.submissionPermissionService = new backend.SubmissionPermissionService(core)
        this.paperPermissionsService = new backend.PaperPermissionsService(core)
        this.paperEventService = new backend.PaperEventService(core)
        this.notificationService = new backend.NotificationService(core)

    }

    async getRelations(user, results, requestedRelations) {
        const relations = {}


        // ======== Default Relations =========================================
        // These are relations we always retrieve and return.

        // ======== fields ====================================================
        const fieldIds = []
        for(const paper of results.list) {
            for(const field of paper.fields) {
                fieldIds.push(field.id)
            }
        }

        const fieldResults = await this.fieldDAO.selectFields('WHERE fields.id = ANY($1::bigint[])', [ fieldIds ])
        relations.fields = fieldResults.dictionary

        // ======== users =====================================================
        const userIds = []
        for(const paper of results.list) {
            for(const author of paper.authors) {
                userIds.push(author.userId)
            }
        }

        const userResults = await this.userDAO.selectCleanUsers('WHERE users.id = ANY($1::bigint[])', [ userIds ])
        relations.users = userResults.dictionary

        // ======== submissions ===============================================
        let visibleIds = []
        if ( user ) {
            visibleIds = await this.submissionPermissionService.getVisibleSubmissionIds(user.id)
        } else {
            const visibleSubmissionResults = await this.database.query(`
                            SELECT paper_id FROM journal_submissions WHERE status='published'
                        `, [])

            for(const row of visibleSubmissionResults.rows) {
                visibleIds.push(row.paper_id)
            }
        }

        const paperIds = []
        for(const paper of results.list) {
            paperIds.push(paper.id)
        }

        const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.paper_id = ANY($1::bigint[]) AND journal_submissions.paper_id = ANY($2::bigint[])', 
            [ paperIds, visibleIds ]
        )
        relations.submissions = submissionResults.dictionary

        // We pull journals for the submissions.
        const journalIds = []
        for(const submission of submissionResults.list) {
            journalIds.push(submission.journalId)
        }

        const journalResults = await this.journalDAO.selectJournals(
            'WHERE journals.id = ANY($1::bigint[])', [ journalIds ]
        )
        relations.journals = journalResults.dictionary

        // ======== Relation Requests =========================================
        // These are relations that must be requested using the query parameter.
        

        // NOTE Currently all the relations we *can* pull, we always *do* pull.

        return relations
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
            page: 1,
            emptyResult: false,
            requestedRelations: ( query.relations ? query.relations : [] )
        }

        let count = 0
        let and = ''

        // If we're not intentionally retrieving drafts then we're getting
        // published papers.
        //
        // If we are intentionally getting drafts, make sure we only return the
        // drafts that a user has permission to see.
        if (query.isDraft && query.isDraft.toLowerCase() === 'true' ) {
            count += 1
            and = ( count > 1 ? ' AND ' : '' )

            let visibleIds = []

            // Preprints the session user can review.
            if ( query.type == 'preprint') {
                visibleIds = await this.paperPermissionsService.getPreprints()

            // Retrieves all of a  
            } else if (session.user && query.type == 'drafts' ) {
                visibleIds = await this.paperPermissionsService.getDrafts(session.user.id)
            } else if ( session.user && query.type == 'private-drafts' ) {
                visibleIds = await this.paperPermissionsService.getPrivateDrafts(session.user.id)
            } else if ( session.user && query.type == 'user-submissions' ) {
                visibleIds = await this.paperPermissionsService.getUserSubmissions(session.user.id)
            } else if (session.user && query.type == 'review-submissions' ) {
                visibleIds = await this.paperPermissionsService.getVisibleDraftSubmissions(session.user.id)
            } else if ( session.user && query.type == 'assigned-review' ) {
                const assignedResults = await this.database.query(`
                    SELECT journal_submissions.paper_id
                        FROM journal_submissions
                            LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                        WHERE journal_submission_reviewers.user_id = $1
                `, [ session.user.id ])

                visibleIds = assignedResults.rows.map((r) => r.paper_id)
            } else {
                result.emptyResult = true
                return result
            }
            
            result.where += `${and} papers.id = ANY($${count}::bigint[])`
            result.params.push(visibleIds)

            count += 1
            and = ( count > 1 ? ' AND ' : '')
            result.where += `${and} papers.is_draft = $${count}`
            result.params.push(true)
        } else {
            count += 1
            and = ( count > 1 ? ' AND ' : '' )
            result.where += `${and} papers.is_draft = $${count}`
            result.params.push(false)
        }

        if ( query.journals ) {
            const results = await this.database.query(`
                SELECT paper_id FROM journal_submissions WHERE journal_id = ANY($1::bigint[])
                `, [ query.journals]
            )

            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '')

                result.where += `${and} papers.id = ANY($${count}::bigint[])`
                result.params.push(results.rows.map((r) => r.paper_id))
            } else {
                result.emptyResult = true
                return result
            }
        }

        if ( query.authors ) {
            const results = await this.database.query(`
                SELECT paper_id FROM paper_authors WHERE user_id = ANY($1::bigint[]) GROUP BY paper_id HAVING COUNT(DISTINCT user_id) = $2
            `, [ query.authors, query.authors.length ])

            if ( results.rows.length > 0 ) {
                const paperIds = results.rows.map((r) => r.paper_id)
                
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} papers.id = ANY($${count}::bigint[])`
                result.params.push(paperIds)
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

        if ( query.status && query.status.length > 0 ) {
            let privateDraft = query.status.includes('private-draft') 
            let preprint = query.status.includes('preprint') 
    
            const searchStatuses = query.status.filter((s) => s !== 'private-draft' && s !== 'preprint')

            const results = await this.database.query(`
                SELECT DISTINCT papers.id 
                    FROM papers 
                        LEFT OUTER JOIN journal_submissions ON papers.id = journal_submissions.paper_id
                    WHERE journal_submissions.status = ANY($1::journal_submission_status[])
                        ${ privateDraft ? 'OR papers.is_draft = TRUE AND papers.show_preprint = FALSE' : ''}
                        ${ preprint ? 'OR papers.is_draft = TRUE AND papers.show_preprint = TRUE' : ''}
            `, [ searchStatuses ])

            const paperIds = results.rows.map((r) => r.id)

            count += 1
            and = (count > 1 ? ' AND ' : '')
            result.where += `${and} papers.id = ANY($${count}::bigint[])`
            result.params.push(paperIds)
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
            // Pass the page through so we can return it in the meta.
            result.page = query.page

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
        const { where, params, order, emptyResult, page, requestedRelations } = await this.parseQuery(request.session, request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: this.paperDAO.PAGE_SIZE,
                    numberOfPages: 1
                },
                dictionary: {},
                list: [],
                relations: {}
            })
        }

        const results = await this.paperDAO.selectPapers(where, params, order)
        results.meta = await this.paperDAO.countPapers(where, params, page)

        results.relations = await this.getRelations(request.session.user, results, requestedRelations)

        return response.status(200).json(results)
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
        if ( ! paper.authors.find((a) => a.userId == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `User(${user.id}) submitted a paper with out being an owner of that paper!`)
        }

        // 4. Paper has at least 1 valid author.
        if ( paper.authors.length < 1 ) {
            throw new ControllerError(400, 'no-authors',
                `User(${user.id}) submitted a paper with out any authors.`)
        }

        const authorIds = paper.authors.map((a) => a.userId)
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

        // TODO TECHDEBT Proper transactions: https://node-postgres.com/features/transactions
        //
        // See the note in the documentation above.
        paper.id = await this.paperDAO.insertPaper(paper) 
        await this.paperDAO.insertAuthors(paper) 
        await this.paperDAO.insertFields(paper)
        await this.paperDAO.insertVersions(paper)

        
        const results = await this.paperDAO.selectPapers("WHERE papers.id=$1", [paper.id])
        const entity = results.dictionary[paper.id]
        if ( ! entity ) {
            throw new ControllerError(500, `server-error`, `Paper ${paper.id} does not exist after insert!`)
        }
        
        const event = {
            paperId: entity.id,
            actorId: user.id,
            version: entity.versions[0].version,
            type: 'paper:new-version'
        }
        await this.paperEventService.createEvent(request.session.user, event)

        // ==== Notifications =============================================
        // authors 

        for ( const author of entity.authors) {
            if ( author.userId != request.session.user.id ) {

                await this.notificationService.createNotification(
                    author.userId,
                    'author:paper-submitted',
                    {
                        correspondingAuthor: request.session.user,
                        paper: entity
                    }
                )
            }
        }


        const relations = await this.getRelations(request.session.user, results)
        
        return response.status(201).json({ 
            entity: entity,
            relations: relations
        })
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
        const results = await this.paperDAO.selectPapers('WHERE papers.id=$1', [request.params.id])

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. If the paper is a draft, user must be logged in and have review
         * privileges on that draft.
         * 
         * **********************************************************/

        if ( ! results.dictionary[request.params.id] ) {
            throw new ControllerError(404, 'not-found', `Paper(${request.params.id}) not found.`)
        }

        const paper = results.dictionary[request.params.id]
        if ( paper.isDraft ) {
            if ( ! request.session.user && ! paper.showPreprint ) {
                throw new ControllerError(403, 'not-authenticated', `Unauthenticated user attempting to view draft.`)
            }

            // TODO update visibility permissions 

        }

        /************************************************************
         * Permissions Checking Complete
         *      Return the Paper
         ************************************************************/
        const relations = await this.getRelations(request.session.user, results)

        return response.status(201).json({ 
            entity: paper,
            relations: relations
        })
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

        const existingResults = await this.paperDAO.selectPapers('WHERE papers.id=$1', [ paper.id ])
        const existing = existingResults.dictionary[paper.id] 

        // 2. Paper(:paper_id) must exist.
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a paper(${paper.id}) that doesn't exist!`)
        }

        // 3. User must be an owning author on the Paper(:paper_id)
        if ( ! existing.authors.find((a) => a.userId == user.id && a.owner) ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `Non-owner user(${user.id}) attempting to PATCH paper(${paper.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! existing.isDraft ) {
            throw new ControllerError(403, `not-authorized:published`,
                `User(${user.id}) attempting to PATCH a published paper.`)
        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the Paper.
         ********************************************************/

        await this.paperDAO.updatePartialPaper(paper)

        const results = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper.id])
        const entity = results.dictionary[paper.id]

        if ( ! entity ) {
            throw new ControllerError(500, `server-error`, `Failed to find paper(${paper.id}) after patching!`)
        } 

        if ( entity.showPreprint && ! existing.showPreprint ) {
            const event = {
                paperId: entity.id,
                actorId: user.id,
                version: entity.versions[0].version,
                type: 'paper:preprint-posted'
            }
            await this.paperEventService.createEvent(request.session.user, event)

            for(const author of entity.authors) {
                await this.notificationService.createNotification(
                    author.userId,
                    'author:preprint-posted',
                    {
                        correspondingAuthor: user,
                        paper: entity
                    }
                )
            }
        }

        const relations = await this.getRelations(request.session.user, results)

        return response.status(201).json({ 
            entity: entity,
            relations: relations
        })
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

        return response.status(200).json({ 
            entity: { id: request.params.id }, 
            relations: {}
        })
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

        const existingResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])
        const existing = existingResults.dictionary[paperId]

        // 2. Paper(:paper_id) must exist.
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${user.id}) attempted to post a new version of a paper that doesn't exist.`)
        }

        // 3. User must be an owning author on Paper(:paper_id)
        if ( ! existing.authors.find((a) => a.userId == user.id && a.owner)) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner user(${user.id}) attempting to delete paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! existing.isDraft ) {
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

        await this.paperDAO.insertVersion(existing, version)

        const results = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])
        const entity = results.dictionary[paperId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Paper(${paperId}) not found after inserting a new version!`)
        }

        const event = {
            paperId: entity.id,
            actorId: user.id,
            version: entity.versions[0].version,
            type: 'paper:new-version'
        }
        await this.paperEventService.createEvent(request.session.user, event)

        // ==== Notifications =============================================
        // authors 

        for ( const author of entity.authors) {
            await this.notificationService.createNotification(
                author.userId,
                'author:new-version',
                {
                    correspondingAuthor: request.session.user,
                    paper: entity
                }
            )
        }

        // Reviewers
        const reviewerResults = await this.database.query(`
            SELECT user_id FROM journal_submission_reviewers 
                LEFT OUTER JOIN journal_submissions ON journal_submission_reviewers.submission_id = journal_submisisons.id
            WHERE journal_submissions.paper_id = $1
        `, [ entity.id ])

        if ( reviewerResults.rows.length > 0 ) {
            for ( const row of reviewerResults.rows) {  
                await this.notificationService.createNotification(
                    row.user_id,
                    'reviewer:new-version',
                    {
                        correspondingAuthor: request.session.user,
                        paper: entity
                    }
                )
            }
        }
        
        // Editor
        const editorResults = await this.database.query(`
            SELECT user_id FROM journal_submission_editors
                LEFT OUTER JOIN journal_submissions ON journal_submission_editors.submission_id = journal_submisisons.id
            WHERE journal_submissions.paper_id = $1
        `, [ entity.id ])

        if ( editorResults.rows.length > 0 ) {
            for ( const row of editorResults.rows) {  
                await this.notificationService.createNotification(
                    row.user_id,
                    'editor:new-version',
                    {
                        correspondingAuthor: request.session.user,
                        paper: entity
                    }
                )
            }
        }

        const relations = await this.getRelations(request.session.user, results)

        return response.status(201).json({ 
            entity: entity,
            relations: relations
        })
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

    async getPaperSubmissions(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. If authenticated user is paper author, can see all submissions.
         * 3. If authenticated user is not paper author, but is Journal Member can see:
         * 3a. IF authenticated user is 'reviewer', may only view submissions in review.
         * 3b. IF authenticated user is 'editor' or 'owner', may view all submissions.
         *
         * Data validation:
         * 
         * **********************************************************/

        const paperId = request.params.paperId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const paperAuthorResults = await this.database.query(`
            SELECT paper_authors.user_id 
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id 
                WHERE papers.id = $1
        `, [ paperId ])

        if ( paperAuthorResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Paper(${paperId}) not found when requesting submissions.`)
        }

        // 2. If authenticated user is paper author, can see all submissions.
        const isAuthor = paperAuthorResults.rows.find((r) => r.user_id == user.id) ? true : false
        if ( isAuthor ) {
            const results = await this.journalSubmissionDAO.selectJournalSubmissions('WHERE journal_submissions.paper_id = $1', [ paperId ])

            // Just return an empty result.
            if ( results.list.length <= 0 ) {
                return response.status(200).json([])
            } else {
                return response.status(200).json(results.list)
            }
        }

        // 3. If authenticated user is not paper author, but is Journal Member can see:
        const submissionResults = await this.database.query(`
            SELECT journal_submissions.id, journal_submissions.status, journal_members.permissions 
                FROM journal_members 
                    LEFT OUTER JOIN journal_submissions ON journal_submissions.journal_id = journal_members.journal_id
                WHERE journal_submissions.paper_id = $1 AND journal_members.user_id = $2
        `, [ paperId, user.id ])

        const submissionIds = []
        for(const submission of submissionResults.rows) {
            // 3a. IF authenticated user is 'reviewer', may only view submissions in review.
            if ( submission.permissions == 'reviewer' && submission.status == 'in-review' ) {
                submissionIds.push(submission.id)
            } 

            // 3b. IF authenticated user is 'editor' or 'owner', may view all submissions.
            else if ( submission.permissions == 'editor' || submission.permissions == 'owner' ) {
                submissionIds.push(submission.id)
            }
        }

        const submissions = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = ANY($1::bigint[])', 
            [ submissionIds ]
        )

        return response.status(200).json(submissions.list)
    }

} 
