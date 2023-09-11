const { PaperEventDAO, PaperDAO, UserDAO, ReviewDAO, JournalSubmissionDAO } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PaperEventController {


    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)
        this.userDAO = new UserDAO(core)
        this.reviewDAO = new ReviewDAO(core)
        this.submissionDAO = new JournalSubmissionDAO(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}

        // ======== Default Relations =========================================
        // These are relations we always retrieve and return.

        const userIds = []
        const reviewIds = []
        const reviewCommentIds = []
        const submissionIds = []
        for(const [id, event] of Object.entries(results.dictionary)) {
            if ( event.actorId ) {
                userIds.push(event.actorId)
            } 
            if ( event.assigneeId ) {
                userIds.push(event.assigneeId)
            }
            if ( event.reviewId ) {
                reviewIds.push(event.reviewId)
            }
            if ( event.reviewCommentId ) {
                reviewCommentIds.push(event.reviewCommentId)
            }
            if ( event.submissionId ) {
                submissionIds.push(event.submissionId)
            }
        }

        // ======== Users =====================================================
        const userResults = await this.userDAO.selectCleanUsers(`WHERE users.id = ANY($1::bigint[])`, [ userIds ])
        relations.users = userResults.dictionary

        // ======== reviews ===================================================

        const reviewResults = await this.reviewDAO.selectReviews(
            `WHERE reviews.id = ANY($1::bigint[]) OR review_comments.id = ANY($2::bigint[])`, 
            [ reviewIds, reviewCommentIds ]
        )
        relations.reviews = reviewResults.dictionary

        // ======== Submissions ===============================================
        const submissionResults = await this.submissionDAO.selectJournalSubmissions(
            `WHERE journal_submissions.id = ANY($1::bigint[])`,
            [ submissionIds ]
        )
        relations.submissions = submissionResults.dictionary

        if ( requestedRelations ) {
            for(const relation of requestedRelations ) {
                if ( relation == 'papers' ) {
                    const paperIds = []
                    for(const [id, event] of Object.entries(results.dictionary)) {
                        paperIds.push(event.paperId)
                    }

                    const paperResults = await this.paperDAO.selectPapers(`WHERE papers.id = ANY($1::bigint[])`, [ paperIds ])
                    relations.papers = paperResults.dictionary
                }
            }
        }

        return relations
    }

    async parseQuery(session, query, where, params) {

        const result = {
            where: (where ? where : '' ),
            params: ( params ? params : []),
            order: '',
            emptyResult: false,
            requestedRelations: ( query.relations ? query.relations : [] )
        }

        let count = params.length 
        let and = ''

        if ( query.version ) {
            count += 1
            and = ( count > 1 ? ' AND ' : '')

            result.where += `${and} paper_events.version = $${count}`
            result.params.push(query.version)
        }

        if ( query.since && query.since != 'always') {
            count += 1
            and = ( count > 1 ? ' AND ' : '')

            result.where += `${and} paper_events.event_date::timestamptz(2) > $${count}::timestamptz(2)`
            result.params.push(query.since)
        }

        // If we do have a where clause at this point, put 'WHERE' where 
        if ( result.where.length > 0) {
            result.where = `WHERE ${result.where}` 
        }

        return result
    }

    async getEvents(request, response) {
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
        
        const paperId = request.params.paperId

        const { where, params, order, emptyResult, requestedRelations } = await this.parseQuery(
            request.session, 
            request.query,
            'paper_events.paper_id = $1',
            [ paperId ]
        )

        if ( emptyResult ) {
            return response.status(200).json({
                dictionary: {},
                list: [],
                relations: {}
            })
        }
        
        const results = await this.paperEventDAO.selectEvents(where, params)

        results.relations = await this.getRelations(request.session.user, results, requestedRelations)

        return response.status(200).json(results)
    }

    async patchEvent(request, response) {

        // Not yet implemented.
        return response.status(501).send()
    }

    async getAuthorFeed(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 
         * **********************************************************/

        // 1. User is authenticated.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to get feed!`)
        }





    }

    async getReviewerFeed(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 
         * **********************************************************/

        // 1. User is authenticated.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to get feed!`)
        }
    }

    async getEditorFeed(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 
         * **********************************************************/

        // 1. User is authenticated.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to get feed!`)
        }

        const user = request.session.user

        /**********************************************************************
         * Permissions checks complete, return the events
         *********************************************************************/

        // For journals on which the user is a 'managing-editor' get all events.
        const managingEditorResults = await this.core.database.query(`
            SELECT journal_submissions.id FROM journal_submissions
                LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
            WHERE journal_members.user_id = $1 AND journal_members.permissions = 'owner'
        `, [ user.id ])

        // For journals on which the user is an 'editor' only get events for
        // the submissions the editor is assigned to.
        const assignedEditorResults = await this.core.database.query(`
            SELECT journal_submissions.id FROM journal_submissions
                LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
            WHERE journal_submission_editors.user_id = $1 
        `, [ user.id ])
        
        const managingEditorPaperIds = managingEditorResults.rows.map((r) => r.id)
        const assignedEditorPaperIds = assignedEditorResults.rows.map((r) => r.id)

        const { where, params, order, emptyResult, requestedRelations } = await this.parseQuery(
            request.session, 
            request.query,
            `
            (paper_events.submission_id = ANY($1::bigint[]) 
                OR paper_events.submission_id = ANY($2::bigint[]))
            AND (paper_events.type = 'version-uploaded'
                OR paper_events.type = 'review-posted'
                OR paper_events.type = 'submitted-to-journal')
            `,
            [ managingEditorPaperIds, assignedEditorPaperIds ]
        )

        if ( emptyResult ) {
            return response.status(200).json({
                dictionary: {},
                list: [],
                relations: {}
            })
        }
        
        const results = await this.paperEventDAO.selectEvents(where, params, 'newest')

        results.relations = await this.getRelations(request.session.user, results, requestedRelations)

        return response.status(200).json(results)

    }

}
