/****************************************************************************** JournalSubmissionController
 *
 * Restful routes for manipulating journal submissions.
 *
 ******************************************************************************/

const { 
    JournalDAO, 
    JournalSubmissionDAO,
    PaperDAO,
    UserDAO,
    FieldDAO,
    PaperEventService,
    DAOError } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class JournalSubmissionController {

    constructor(core) {
        this.core = core

        this.journalSubmissionDAO = new JournalSubmissionDAO(this.core)
        this.journalDAO = new JournalDAO(this.core)
        this.paperDAO = new PaperDAO(this.core)
        this.userDAO = new UserDAO(this.core)
        this.fieldDAO = new FieldDAO(this.core)

        this.paperEventService = new PaperEventService(this.core)
    }

    /**
     *
     */
    async getRelations(results, requestedRelations) {
        const relations = {}

        if ( requestedRelations ) {
            for(const relation of requestedRelations) {
                if ( relation == 'papers' ) {
                    const paperIds = []
                    for(const submission of results.list) {
                        paperIds.push(submission.paperId)
                    }

                    const paperResults = await this.paperDAO.selectPapers(`WHERE papers.id = ANY($1::bigint[])`, [ paperIds ])
                    relations.papers = paperResults.dictionary
                } else if (relation == 'users' ) {
                    const userIds = []
                    for(const submission of results.list) {
                        if ( submission.submitterId ) {
                            userIds.push(submission.submitterId)
                        }
                        if ( submission.deciderId ) {
                            userIds.push(submission.deciderId)
                        }
                        for(const reviewer of submission.reviewers) {
                            userIds.push(reviewer.userId)
                        }
                        for(const editor of submission.editors) {
                            userIds.push(editor.userId)
                        }
                    }

                    const userResults = await this.userDAO.selectUsers('WHERE users.id = ANY($1::bigint[])', [ userIds ])
                    relations.users = userResults.dictionary
                } else if ( relation == 'journals' ) {
                    const journalIds = []
                    for(const submission of results.list) {
                        if ( submission.journalId ) {
                            journalIds.push(submission.journalId)
                        }
                    }

                    const journalResults = await this.journalDAO.selectJournals('WHERE journals.id = ANY($1::bigint[])', [ journalIds ])
                    relations.journals = journalResults.dictionary
                }
            }
        }

        return relations
    }

    /**
     * Parse a query string from the `GET /journals` endpoint for use with both
     * `JournalDAO::selectJournals()` and `JournalDAO::countJournals()`.
     *
     * @param {Object} query    The query string (from `request.query`) that we
     * wish to parse.
     * @param {int} query.page    (Optional) A page number indicating which page of
     * results we want.  
     * @param {string} query.sort (Optional) A sort parameter describing how we want
     * to sort journals.
     * @param {Object} options  A dictionary of options that adjust how we
     * parse it.
     * @param {boolean} options.ignorePage  Skip the page parameter.  It will
     * still be in the result object and will default to `1`.
     *
     * @return {Object} A result object with the results in a form
     * understandable to `selectJournals()` and `countJournals()`.  Of the following
     * format:
     * ```
     * { 
     *  where: 'WHERE ...', // An SQL where statement.
     *  params: [], // An array of paramters matching the $1,$2, parameterization of `where`
     *  page: 1, // A page parameter, to select which page of results we want.
     *  order: '', // An SQL order statement.
     *  emptyResult: false // When `true` we can skip the selectJournals() call,
     *  // because we know we have no results to return.
     * }
     * ```
     */
    async parseQuery(where, params, query, options) {
        options = options || {
            ignorePage: false
        }

        let count = params.length 
        let and = count > 1 ? ' AND ' : ''

        const result = {
            where: where,
            params: params,
            page: 1,
            order: '',
            emptyResult: false,
            requestedRelations: ( query.relations ? query.relations : [])
        }

        if ( query.status && query.status.length > 0 ) {
            let privateDraft = query.status.includes('privateDraft') 
            let preprint = query.status.includes('preprint') 
    
            const searchStatuses = query.status.filter((s) => s !== 'privateDraft' && s !== 'preprint')

            const results = await this.core.database.query(`
                SELECT DISTINCT journal_submissions.id 
                    FROM journal_submissions 
                        LEFT OUTER JOIN papers ON papers.id = journal_submissions.paper_id
                    WHERE journal_submissions.status = ANY($1::journal_submission_status[])
                        ${ privateDraft ? 'OR papers.is_draft = TRUE AND papers.show_preprint = FALSE' : ''}
                        ${ preprint ? 'OR papers.is_draft = TRUE AND papers.show_preprint = TRUE' : ''}
            `, [ searchStatuses ])

            count += 1
            and = count > 1 ? ' AND ' : ''

            result.where += `${and} journal_submissions.id = ANY($${count}::bigint[])`
            result.params.push(results.rows.map((r) => r.id))
        }

        if ( query.authors ) {
            const results = await this.core.database.query(`
                SELECT journal_submissions.id
                    FROM journal_submissions
                        LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = journal_submissions.paper_id
                    WHERE paper_authors.user_id = ANY($1::bigint[]) 
                    GROUP BY journal_submissions.id 
                    HAVING COUNT(DISTINCT paper_authors.user_id) = $2
            `, [ query.authors, query.authors.length ])

            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} journal_submissions.id = ANY($${count}::bigint[])`
                result.params.push(results.rows.map((r) => r.id))
            } else {
                result.emptyResult = true
                return result
            }
        }

        if ( query.reviewers ) {
            const results = await this.core.database.query(`
                SELECT submission_id FROM journal_submission_reviewers WHERE user_id = ANY($1::bigint[])
            `, [ query.reviewers ])

            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} journal_submissions.id = ANY($${count}::bigint[])`
                result.params.push(results.rows.map((r) => r.submission_id))
            } else {
                result.emptyResult = true
                return result
            }
        }

        if ( query.editors ) {
            const results = await this.core.database.query(`
                SELECT submission_id FROM journal_submission_editors WHERE user_id = ANY($1::bigint[])
            `, [ query.editors ])

            if ( results.rows.length > 0 ) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} journal_submissions.id = ANY($${count}::bigint[])`
                result.params.push(results.rows.map((r) => r.submission_id))
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
            const results = await this.core.database.query(`
                SELECT DISTINCT journal_submissions.id
                    FROM journal_submissions
                        LEFT OUTER JOIN paper_fields ON journal_submissions.paper_id = paper_fields.paper_id
                    WHERE paper_fields.field_id = ANY ($1::bigint[])
            `, [ fieldIds])

            if ( results.rows.length > 0) {
                count += 1
                and = ( count > 1 ? ' AND ' : '' )
                result.where += `${and} journal_submissions.id = ANY($${count}::bigint[])`
                result.params.push(results.rows.map((r) => r.id))
            } else {
                result.emptyResult = true
                return result
            }
        }


        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        if ( query.sort == 'newest' ) {
            result.order = 'journal_submissions.created_date desc'
        } 

        // If we haven't added anything to the where clause, then clear it.
        if ( result.where == 'WHERE') {
            result.where = ''
        } else {
            result.where = `WHERE ${result.where}`
        }

        return result
    }

    /**
     * GET /journal/:journalId/submissions
     *
     * Get a list of journal submissions. 
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getSubmissions(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Logged in User must be journal member.
         * 3a. IF user is 'reviewer', may only view submissions in review.
         * 3b. IF user is 'editor' or 'owner', may view all submissions.
         *
         * Data validation:
         * 
         * **********************************************************/

        const journalId = request.params.journalId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        if ( ! journal ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${journalId}) not found.`)
        }

        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to view submissions for Journal(${journalId}) of which they are not a member.`)
        }


        // The next set of permissions determines which query we execute.
        let queryWhere = ''
        let queryParams = []

        // 3a. IF user is 'reviewer', may only view submissions in review.
        if ( member.permissions == 'reviewer' ) {
            queryWhere = `journal_submissions.journal_id = $1 AND journal_submissions.status = $2`
            queryParams = [ journal.id, 'review' ]
        } 
        // 3b. IF user is 'editor' or 'owner', may view all submissions.
        else if ( member.permissions == 'editor' || member.permissions == 'owner') {
            queryWhere = 'journal_submissions.journal_id = $1'
            queryParams = [ journal.id ]
        } else {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) with permissions ${member.permissions} was denied access to submissions of Journal(${journal.id}).`)
        }

        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the GET
         **********************************************************************/

        const { where, params, order, page, emptyResult, requestedRelations } = await this.parseQuery(queryWhere, queryParams, request.query)
        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: this.journalSubmissionDAO.PAGE_SIZE,
                    numberOfPages: 1
                },
                dictionary: {},
                list: [],
                relations: {}
            })
        }
        
        const results = await this.journalSubmissionDAO.selectJournalSubmissions(where, params, order, page)
        results.meta = await this.journalSubmissionDAO.countJournalSubmissions(where, params, page)

        results.relations = await this.getRelations(results, requestedRelations)

        return response.status(200).json(results)
    }

    /**
     * POST /journal/:journalId/submissions
     *
     * Create a new journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postSubmissions(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. User is owner author of paper.
         * 3. Paper cannot already have been submitted.
         *
         * Data validation:
         * 
         * 4. Paper.id is valid.
         * **********************************************************/
        const journalId = request.params.journalId
        const paperId = request.body.paperId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const authorResults = await this.core.database.query(`
            SELECT papers.id, paper_authors.user_id, paper_authors.owner 
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = papers.id
                WHERE papers.id = $1
        `, [ paperId ])

        // 4. Paper.id is valid.
        if ( authorResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', 
                `Attempt to submit Paper(${paperId}) to Journal(${journalId}) but paper not found!`)
        }

        // 2. User is owner author of paper.
        const author = authorResults.rows.find((r) => r.user_id == user.id && r.owner)
        if ( ! author ) {
            throw new ControllerError(403, 'not-authorized:not-owner',
                `User(${user.id}) attempted to submit Paper(${paperId}) to Journal(${journalId}) while not owning author.`)
        }

        // 3. Paper cannot already have been submitted.
        const existingSubmissionResults = await this.core.database.query(`
            SELECT paper_id FROM journal_submissions WHERE paper_id = $1
        `, [ paperId ])

        if ( existingSubmissionResults.rows.length >= 1 ) {
            throw new ControllerError(400, 'duplicate-submission',
                `User(${user.id}) attempted to resubmit Paper(${paperId}) to Journal(${journalId}).`)
        }

        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST 
         **********************************************************************/

        const submission = {
            journalId: journalId,
            paperId: paperId
        }
        const id = await this.journalSubmissionDAO.insertJournalSubmission(submission)

        const results = await this.journalSubmissionDAO.selectJournalSubmissions('WHERE journal_submissions.id = $1', [id])
        const entity = results.dictionary[id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Submission(${id}) of Paper(${paperId}) to Journal(${journalId}) not found after insert!`)
        }

        const event = {
            paperId: paperId,
            actorId: user.id,
            type: 'submitted-to-journal',
            submissionId: id
        }
        await this.paperEventService.createEvent(request.session.user, event)

        const relations = await this.getRelations(results)

        return response.status(201).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * GET /journal/:journalId/submission/:id
     *
     *  Retrieve a particular journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getSubmission(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal must exist.
         * 3. Logged in User must be journal member.
         * 4a. IF user is 'reviewer', may only view submissions in review.
         * 4b. IF user is 'editor' or 'owner', may view all submissions.
         * 
         * **********************************************************/
        const journalId = request.params.journalId
        const id = request.params.id

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        // 2. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${journalId}) not found.`)
        }

        // 3. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to view submissions for Journal(${journalId}) of which they are not a member.`)
        }

        /**********************************************************************
         * Permission Checks and Validation (mostly) Complete
         *       Execute the GET
         *
         * In this case, we'll perform the final permissions check while
         * retrieving the requested content.
         **********************************************************************/
        const results  = await this.journalSubmissionDAO.selectJournalSubmissions(
            `WHERE journal_submissions.id = $1`,
            [ id ]
        )

        if (results.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Submission(${id}) was not found.`)
        }

        // 3a. IF user is 'reviewer', may only view submissions in review.
        if ( member.permissions == 'reviewer' && results.dictionary[id].status !== 'review' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to access Submission(${id}) which they weren't authorized for.`)
        }

        // 3b. IF user is 'editor' or 'owner', may view all submissions.
        if ( member.permissions != 'editor' && member.permissions != 'owner') {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) with permissions ${member.permissions} was denied access to submissions of Journal(${journal.id}).`)
        }
    
        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.list[0],
            relations: relations
        })
    }

    /**
     * PUT /journal/:journalId/submission/:id
     *
     * Replace a journal submission wholesale.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async putSubmission(request, response) {
        throw new ControllerError(501, 'not-implemented', `PUT Submission is not implemented.`)
    }

    /**
     * PATCH /journal/:journalId/submission/:id
     *
     * Update a journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchSubmission(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal must exist.
         * 3. Submission must exist.
         * 4. Logged in User must be journal member and editor or owner.
         * NOTE TECHDEBT Allow authors to patch?
         *
         * **********************************************************/
        const journalId = request.params.journalId
        const id = request.params.id
        const submissionPatch = request.body

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        // 2. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${journalId}) not found.`)
        }

        // 3. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to patch Submission(${id}) for Journal(${journalId}) of which they are not a member.`)
        }

        if ( member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to patch a submission for Journal(${journalId}) of which they are neither editor nor owner.`)
        }

        const existingResults = await this.journalSubmissionDAO.selectJournalSubmissions(`WHERE journal_submissions.id = $1`, [ id ])
        const existing = existingResults.dictionary[id]

        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${user.id}) atempted to patch Submission(${id}) that doesn't appear to exist.`)
        }

        // TODO Permissions around who can update the decision, as well as the status.

        // If this is a decision, we need to set the deciderId from the session.
        if ( submissionPatch.status != existing.status 
            && (submissionPatch.status == 'published' || submissionPatch.status == 'rejected')) 
        {
            submissionPatch.deciderId = user.id
        }

        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the Patch 
         **********************************************************************/

        await this.journalSubmissionDAO.updatePartialSubmission(submissionPatch)

        const results = await this.journalSubmissionDAO.selectJournalSubmissions('WHERE journal_submissions.id = $1', [id])
        const entity = results.dictionary[id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Submission(${id}) to Journal(${journalId}) not found after insert!`)
        }

        // If we published this paper, we need to update its draft status.
        let requestedRelations = []
        if (existing.status != submissionPatch.status && submissionPatch.status == 'published' ) {
            const paperPatch = {
                id: entity.paperId,
                isDraft: false
            }

            await this.paperDAO.updatePartialPaper(paperPatch)
            requestedRelations.push('papers')
        }

        // If the status changed, we need to post an event.
        if ( existing.status != submissionPatch.status ) {
            const event = {
                paperId: entity.paperId,
                actorId: user.id,
                type: 'submission-status-changed',
                submissionId: entity.id,
                newStatus: submissionPatch.status
            }
            await this.paperEventService.createEvent(request.session.user, event)
        }

        const relations = await this.getRelations(results, requestedRelations)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * DELETE /journal/:journalId/submission/:id
     *
     * Delete a journal submission. 
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteSubmission(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal must exist.
         * 3. Submission must exist.
         * 4. Logged in User must be journal member and editor or owner.
         * TECHDEBT Allow authors to delete (withdraw)?
         * **********************************************************/
        const journalId = request.params.journalId
        const id = request.params.id

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        // 2. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${journalId}) not found.`)
        }

        // 3. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to delete Submission(${id}) for Journal(${journalId}) of which they are not a member.`)
        }

        if ( member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to delete a submission for Journal(${journalId}) of which they are neither editor nor owner.`)
        }

        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the DELETE 
         **********************************************************************/
        
        await this.journalSubmissionDAO.deleteSubmission(id)

        return response.status(200).json({ entity: { id: id } })
    }

    // ======= Submission Reviewers ===========================================


    /**
     * POST /journal/:journalId/submission/:submissionId/reviewers
     *
     * Assign a reviewer to a journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     *
     */
    async postReviewers(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
         * 3. Journal(journalId) must exist.
         * 4. Logged in User must be Journal(journalId) member.
         * 5. IF Logged In User is owner or editor, may assign anyone.
         * 5a. IF Logged in User is reviewer, may only assign themselves.
         * 6. Assigned reviewer must be a journal member.
         * **********************************************************/
        const journalId = request.params.journalId
        const submissionId = request.params.submissionId

        if ( ! request.body ) {
            throw new ControllerError(400, 'missing-body',
                `Attempt to assigned reviewer to Submission(${submissionId}) missing reviewer.`)
        }

        const reviewer = request.body
        reviewer.submissionId = submissionId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to assign a reviewer!`)
        }

        const user = request.session.user

        // 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
        const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(`WHERE journal_submissions.id = $1`, [ reviewer.submissionId ]) 
        if ( submissionResults.list.length <= 0 ) {
            throw new ControllerError(404, 'submission-not-found', `Attempt to assign reviewer to Submission(${reviewer.submissionId}) which doesn't exist.`)
        }

        const submission = submissionResults.dictionary[reviewer.submissionId]
        if ( submission.journalId !== journalId ) {
            throw new ControlleError(400, 'wrong-journal', 
                `Attempt to assign reviewer to Submission(${reviewer.submission.id}) which belongs to Journal(${submission.journalId}) not Journal(${journalId}).`)
        }

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        // 3. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'journal-not-found',
                `Attempt to assign reviewer to Submission for Journal(${journalId}) which was not found.`)
        }

        // 4. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign reviewers to Submission(${reviewer.submissionId}) for Journal(${journalId}) of which they are not a member.`)
        }

        // 5. IF Logged In User is owner or editor, may assign anyone.
        // 5a. IF Logged in User is reviewer, may only assign themselves.
        if ( reviewer.userId !== user.id && member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign a Revewer(${reviewer.userId}) to a submission for Journal(${journalId}) when they don't have the appropriate permissions.`)
        }

        // Possible TECHDEBT: We're using this as the user existence check to
        // save ourselves a database call.  This will fail if we don't check
        // user existence when we add a member to a journal or if the journal
        // members data gets corrupted in any way.
        //
        // 6. Assigned reviewer must be a journal member.
        const reviewerMember = journal.members.find((m) => m.userId == reviewer.userId)
        if ( ! reviewerMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to assign a reviewer who is not a member of Journal(${journalId}).`)
        }

        
        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST 
         **********************************************************************/

        await this.journalSubmissionDAO.insertJournalSubmissionReviewer(reviewer)

        const results  = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = $1', 
            [ submissionId ]
        )
        const entity = results.dictionary[submissionId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Submission(${submissionId}) after assigning Reviewer(${reviewer.userId}).`)
        }

        const event = {
            paperId: entity.paperId,
            actorId: user.id,
            type: 'reviewer-assigned',
            submissionId: entity.id,
            assigneeId: reviewer.userId
        }
        await this.paperEventService.createEvent(request.session.user, event)

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * DELETE /journal/:journalId/submission/:submissionId/reviewer/:userId
     *
     * Assign a reviewer to a journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     *
     */
    async deleteReviewer(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
         * 3. Journal(journalId) must exist.
         * 4. Logged in User must be Journal(journalId) member.
         * 5. IF Logged In User is owner or editor, may assign anyone.
         * 5a. IF Logged in User is reviewer, may only assign themselves.
         * 6. Assigned reviewer must be a journal member.
         * **********************************************************/
        const journalId = request.params.journalId
        const submissionId = request.params.submissionId
        const userId = request.params.userId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to unassign a reviewer!`)
        }

        const user = request.session.user

        // 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
        const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(`WHERE journal_submissions.id = $1`, [ submissionId ]) 
        if ( submissionResults.list.length <= 0 ) {
            throw new ControllerError(404, 'submission-not-found', `Attempt to unassign reviewer from Submission(${submissionId}) which doesn't exist.`)
        }

        const submission = submissionResults.dictionary[submissionId]
        if ( submission.journalId !== journalId ) {
            throw new ControlleError(400, 'wrong-journal', 
                `Attempt to unassign reviewer from Submission(${submissionId}) which belongs to Journal(${submission.journalId}) not Journal(${journalId}).`)
        }

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId ])
        const journal = journalResults.dictionary[journalId]

        // 3. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'journal-not-found',
                `Attempt to unassign reviewer from Submission(${submissionId}) which belongs to Journal(${journalId}) which was not found.`)
        }

        // 4. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to unassign reviewers to Submission(${submissionId}) for Journal(${journalId}) of which they are not a member.`)
        }

        // 5. IF Logged In User is owner or editor, may assign anyone.
        // 5a. IF Logged in User is reviewer, may only assign themselves.
        if ( userId !== user.id && member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign a Revewer(${userId}) to a submission for Journal(${journalId}) when they don't have the appropriate permissions.`)
        }

        // Possible TECHDEBT: We're using this as the user existence check to
        // save ourselves a database call.  This will fail if we don't check
        // user existence when we add a member to a journal or if the journal
        // members data gets corrupted in any way.
        //
        // 6. Assigned reviewer must be a journal member.
        const reviewerMember = journal.members.find((m) => m.userId == userId)
        if ( ! reviewerMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to assign a reviewer who is not a member of Journal(${journalId}).`)
        }

        
        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the DELETE
         **********************************************************************/
        
        await this.journalSubmissionDAO.deleteJournalSubmissionReviewer(submissionId, userId)

        const results = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = $1', 
            [ submissionId ]
        )
        const entity = results.dictionary[submissionId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Submission(${submissionId}) after unassigning Reviewer(${userId}).`)
        }

        const event = {
            paperId: entity.paperId,
            actorId: user.id,
            type: 'reviewer-unassigned',
            visibility: [ 'public' ],
            submissionId: entity.id,
            assigneeId: userId
        }
        await this.paperEventService.createEvent(request.session.user, event)

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }

    // ======= Submission Editors ===========================================


    /**
     * POST /journal/:journalId/submission/:submissionId/editors
     *
     * Assign an editor to a journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     *
     */
    async postEditors(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
         * 3. Journal(journalId) must exist.
         * 4. Logged in User must be Journal(journalId) member.
         * 5. IF Logged In User is owner or editor, may assign anyone.
         * 5a. IF Logged in User is editor, may only assign themselves.
         * 6. Assigned editor must be a journal member.
         *
         * TODO posted user must be editor or owner
         * **********************************************************/
        const journalId = request.params.journalId
        const submissionId = request.params.submissionId

        if ( ! request.body ) {
            throw new ControllerError(400, 'missing-body',
                `Attempt to assigned editor to Submission(${submissionId}) missing editor.`)
        }

        const editor = request.body
        editor.submissionId = submissionId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to assign a editor!`)
        }

        const user = request.session.user

        // 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
        const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(`WHERE journal_submissions.id = $1`, [ editor.submissionId ]) 
        const existing = submissionResults.dictionary[editor.submissionId]

        if ( ! existing) {
            throw new ControllerError(404, 'submission-not-found', `Attempt to assign editor to Submission(${editor.submissionId}) which doesn't exist.`)
        }

        if ( existing.journalId !== journalId ) {
            throw new ControlleError(400, 'wrong-journal', 
                `Attempt to assign editor to Submission(${editor.submission.id}) which belongs to Journal(${submission.journalId}) not Journal(${journalId}).`)
        }

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId])
        const journal = journalResults.dictionary[journalId]

        // 3. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'journal-not-found',
                `Attempt to assign editor to Submission for Journal(${journalId}) which was not found.`)
        }

        // 4. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign editors to Submission(${editor.submissionId}) for Journal(${journalId}) of which they are not a member.`)
        }

        // 5. IF Logged In User is owner or editor, may assign anyone.
        // 5a. IF Logged in User is editor, may only assign themselves.
        if ( editor.userId !== user.id && member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign an Editor(${editor.userId}) to a submission for Journal(${journalId}) when they don't have the appropriate permissions.`)
        }

        // Possible TECHDEBT: We're using this as the user existence check to
        // save ourselves a database call.  This will fail if we don't check
        // user existence when we add a member to a journal or if the journal
        // members data gets corrupted in any way.
        //
        // 6. Assigned editor must be a journal member.
        const editorMember = journal.members.find((m) => m.userId == editor.userId)
        if ( ! editorMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to assign a editor who is not a member of Journal(${journalId}).`)
        }

        
        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST 
         **********************************************************************/

        await this.journalSubmissionDAO.insertJournalSubmissionEditor(editor)

        const results = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = $1', 
            [ submissionId ]
        )
        const entity = results.dictionary[submissionId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Submission(${submissionId}) after assigning Reviewer(${editor.userId}).`)
        }

        const event = {
            paperId: entity.paperId,
            actorId: user.id,
            type: 'editor-assigned',
            submissionId: entity.id,
            assigneeId: editor.userId
        }
        await this.paperEventService.createEvent(request.session.user, event)

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * DELETE /journal/:journalId/submission/:submissionId/editor/:userId
     *
     * Assign a reviewer to a journal submission.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     *
     */
    async deleteEditor(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
         * 3. Journal(journalId) must exist.
         * 4. Logged in User must be Journal(journalId) member.
         * 5. IF Logged In User is owner or editor, may assign anyone.
         * 5a. IF Logged in User is editor, may only assign themselves.
         * 6. Assigned editor must be a journal member.
         * **********************************************************/
        const journalId = request.params.journalId
        const submissionId = request.params.submissionId
        const userId = request.params.userId

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to unassign a editor!`)
        }

        const user = request.session.user

        // 2. Submission(SubmissionId) must exist and belong to Journal(journalId).
        const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(`WHERE journal_submissions.id = $1`, [ submissionId ]) 
        if ( submissionResults.list.length <= 0 ) {
            throw new ControllerError(404, 'submission-not-found', `Attempt to unassign editor from Submission(${submissionId}) which doesn't exist.`)
        }

        const submission = submissionResults.dictionary[submissionId]
        if ( submission.journalId !== journalId ) {
            throw new ControlleError(400, 'wrong-journal', 
                `Attempt to unassign editor from Submission(${submissionId}) which belongs to Journal(${submission.journalId}) not Journal(${journalId}).`)
        }

        const journalResults = await this.journalDAO.selectJournals('WHERE id = $1', [ journalId ])
        const journal = journalResults.dictionary[journalId]

        // 3. Journal must exist.
        if ( ! journal ) {
            throw new ControllerError(404, 'journal-not-found',
                `Attempt to unassign editor from Submission(${submissionId}) which belongs to Journal(${journalId}) which was not found.`)
        }

        // 4. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to unassign editors to Submission(${submissionId}) for Journal(${journalId}) of which they are not a member.`)
        }

        // 5. IF Logged In User is owner or editor, may assign anyone.
        // 5a. IF Logged in User is editor, may only assign themselves.
        if ( userId !== user.id && member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to assign a Revewer(${userId}) to a submission for Journal(${journalId}) when they don't have the appropriate permissions.`)
        }

        // Possible TECHDEBT: We're using this as the user existence check to
        // save ourselves a database call.  This will fail if we don't check
        // user existence when we add a member to a journal or if the journal
        // members data gets corrupted in any way.
        //
        // 6. Assigned editor must be a journal member.
        const editorMember = journal.members.find((m) => m.userId == userId)
        if ( ! editorMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to assign a editor who is not a member of Journal(${journalId}).`)
        }

        
        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the DELETE
         **********************************************************************/
        
        await this.journalSubmissionDAO.deleteJournalSubmissionEditor(submissionId, userId)

        const results = await this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = $1', 
            [ submissionId ]
        )
        const entity = results.dictionary[submissionId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Submission(${submissionId}) after assigning Assignee(${editor.userId}).`)
        }

        const event = {
            paperId: entity.paperId,
            actorId: user.id,
            type: 'editor-unassigned',
            submissionId: entity.id,
            assigneeId: userId
        }
        await this.paperEventService.createEvent(request.session.user, event)

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }


}
