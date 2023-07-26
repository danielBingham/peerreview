/******************************************************************************
 * JournalSubmissionController
 *
 * Restful routes for manipulating journal submissions.
 *
 ******************************************************************************/

const { JournalDAO, JournalSubmissionDAO, DAOError } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class JournalSubmissionController {

    constructor(core) {
        this.core = core

        this.journalDAO = new JournalDAO(this.core)
        this.journalSubmissionDAO = new JournalSubmissionDAO(this.core)
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

        /**********************************************************************
         * Permission Checks and Validation (mostly) Complete
         *       Execute the GET
         *
         * In this case, we'll perform the final permissions check while
         * retrieving the requested content.
         **********************************************************************/
        let results = []

        // 3a. IF user is 'reviewer', may only view submissions in review.
        if ( member.permissions == 'reviewer' ) {
            const { dictionary, list } = await this.journalSubmissionDAO.selectJournalSubmissions(
                `WHERE journal_submissions.journal_id = $1 AND journal_submissions.status = 'review'`,
                [ journal.id ]
            )

            results = list
        } 
        // 3b. IF user is 'editor' or 'owner', may view all submissions.
        else if ( member.permissions == 'editor' || member.permissions == 'owner') {
            const { dictionary, list } = await this.journalSubmissionDAO.selectJournalSubmissions(
                'WHERE journal_submissions.journal_id = $1', 
                [ journalId ]
            )

            results = list
        } else {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) with permissions ${member.permissions} was denied access to submissions of Journal(${journal.id}).`)
        }

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
        const paperId = request.body.id

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        const results = await this.core.database.query(`
            SELECT papers.id, paper_authors.user_id, paper_authors.owner 
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = papers.id
                WHERE papers.id = $1
        `, [ paperId ])

        // 4. Paper.id is valid.
        if ( results.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', 
                `Attempt to submit Paper(${paperId}) to Journal(${journalId}) but paper not found!`)
        }

        // 2. User is owner author of paper.
        const author = results.rows.find((r) => r.user_id == user.id && r.owner)
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

        const { dictionary, list } = await this.journalSubmissionDAO.selectJournalSubmissions('WHERE id = $1', [id])

        if ( list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Submission(${id}) of Paper(${paperId}) to Journal(${journalId}) not found after insert!`)
        }

        return response.status(201).json(list[0])
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
        const { dictionary, list } = await this.journalSubmissionDAO.selectJournalSubmissions(
            `WHERE journal_submissions.id = $1`,
            [ id ]
        )

        if (list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Submission(${id}) was not found.`)
        }

        // 3a. IF user is 'reviewer', may only view submissions in review.
        if ( member.permissions == 'reviewer' ) {
            if ( dictionary[id].status == 'in-review') {
                return response.status(200).json(dictionary[id])
            } else {
                throw new ControllerError(403, 'not-authorized',
                    `User(${user.id}) attempted to access Submission(${id}) which they weren't authorized for.`)
            }
        } 

        // 3b. IF user is 'editor' or 'owner', may view all submissions.
        if ( member.permissions == 'editor' || member.permissions == 'owner') {
            return response.status(200).json(dictionary[id])
        } else {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) with permissions ${member.permissions} was denied access to submissions of Journal(${journal.id}).`)
        }
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
         * TECHDEBT Allow authors to patch?
         * 5. Patch may only impact the status.
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

        // 5. Patch may only impact the status.
        if ( ! submissionPatch.status ) {
            throw new ControllerError(400, 'no-status',
                `User(${user.id}) attempted to patch Submission(${id}) with out including a status.`)
        }

        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the Patch 
         **********************************************************************/

        await this.journalSubmissionDAO.updatePartialSubmission(submissionPatch)

        const { dictionary, list } = await this.journalSubmissionDAO.selectJournalSubmissions('WHERE id = $1', [id])

        if ( list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Submission(${id}) of Paper(${paperId}) to Journal(${journalId}) not found after insert!`)
        }

        return response.status(201).json(list[0])
    }

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

        return response.status(200).json({ submissionId: id })
    }

    // ======= Submission Reviewers ===========================================

    async getReviewers(request, response) {
        throw new ControllerError(501, 'not-implemented', 
            `JournalSubmissionController.getReviewers() isn't implemented.`)
    }

    async postReviewers(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal(journalId) must exist.
         * 3. Submission(SubmissionId) must exist and belong to Journal(journalId).
         * 4. Logged in User must be Journal(journalId) member.
         * 5. IF Logged In User is owner or editor, may assign anyone.
         * 5a. IF Logged in User is reviewer, may only assign themselves.
         * 6. Assigned reviewer must be a journal member.
         * **********************************************************/
        const journalId = request.params.journalId
        const submissionId = request.params.submissionId

        const reviewer = request.body
        reviewer.submissionId = submissionId

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

        // 4. Logged in User must be journal member.
        const member = journal.members.find((m) => m.userId == user.id)
        if ( ! member ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to delete Submission(${id}) for Journal(${journalId}) of which they are not a member.`)
        }

        // 5. IF Logged In User is owner or editor, may assign anyone.
        // 5a. IF Logged in User is reviewer, may only assign themselves.
        if ( reviewer.userId !== user.id && member.permissions !== 'editor' && member.permissions != 'owner' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to delete a submission for Journal(${journalId}) of which they are neither editor nor owner.`)
        }

        // Possible TECHDEBT: We're using this as the user existence check to
        // save ourselves a database call.  This will fail if we don't check
        // user existence when we add a member to a journal or if the journal
        // members data gets corrupted in any way.
        //
        // 6. Assigned reviewer must be a journal member.
        const reviewerMember = journal.members.find((m) => m.userId == reviewer.user)
        if ( ! reviewerMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to assign a reviewer who is not a member of Journal(${journalId}).`)
        }

        // TODO 3. Submission must exist
        
        /**********************************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST 
         **********************************************************************/

        await this.journalSubmissionsDAO.insertJournalSubmissionReviewer(reviewer)


        const { dictionary, list } = this.journalSubmissionDAO.selectJournalSubmissions(
            'WHERE journal_submissions.id = $1', 
            [ submissionId ]
        )

        if ( ! dictionary[submissionId] ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Submission(${submissionId}) after assigning Reviewer(${reviewer.userId}).`)
        }

        return response.status(200).json(dictionary[submissionId])
    }

    async getReviewer(request, response) {
        throw new ControllerError(501, 'not-implemented', 
            `JournalSubmissionController.getReviewer() isn't implemented.`)
    }

    async putReviewer(request, response) {
        throw new ControllerError(501, 'not-implemented', 
            `JournalSubmissionController.putReviewer() isn't implemented.`)
    }

    async patchReviewer(request, response) {
        throw new ControllerError(501, 'not-implemented', 
            `JournalSubmissionController.patchReviewer() isn't implemented.`)
    }

    async deleteReviewer(request, response) {

    }


}
