const { 
    PaperEventDAO, 
    PaperDAO, 
    PaperVersionDAO,
    PaperCommentDAO,
    UserDAO, 
    ReviewDAO, 
    JournalSubmissionDAO,
    PaperEventService
} = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PaperEventController {


    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)
        this.paperVersionDAO = new PaperVersionDAO(core)
        this.paperCommentDAO = new PaperCommentDAO(core)
        this.userDAO = new UserDAO(core)
        this.reviewDAO = new ReviewDAO(core)
        this.submissionDAO = new JournalSubmissionDAO(core)

        this.paperEventService = new PaperEventService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}

        const events = Object.entries(results.dictionary)
        if ( events.length <= 0 ) {
            return relations 
        }

        // ======== Default Relations =========================================
        // These are relations we always retrieve and return.

        const userIds = []
        const reviewIds = []
        const reviewCommentIds = []
        const submissionIds = []
        const paperVersions = []
        const paperCommentIds = []
        for(const [id, event] of Object.entries(results.dictionary)) {
            paperVersions.push(event.paperVersionId)

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
            if ( event.paperCommentId ) {
                paperCommentIds.push(event.paperCommentId)
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

        // ======== Paper Versions ============================================
        if ( paperVersions.length > 0 ) {
            // If they can view the event, for now we're assuming they can view the version the event is on.
            // TECHDEBT -- This may not be a safe assumption.
            const paperVersionResults = await this.paperVersionDAO.selectPaperVersions(`WHERE paper_versions.id = ANY($1::uuid[])`, [ paperVersions ])
            relations.paperVersions = paperVersionResults.dictionary
        }

        // ======== Paper Comments ============================================
        const paperCommentResults = await this.paperCommentDAO.selectPaperComments(
            `WHERE paper_comments.id = ANY($1::bigint[])`,
            [ paperCommentIds ]
        )
        relations.paperComments = paperCommentResults.dictionary

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

        let count = result.params.length 
        let and = ''

        // ======== Handle Visibility ========================================

        const visibleEventIds = await this.paperEventService.getVisibleEventIds(session.user?.id)

        count += 1
        and = ( count > 1 ? ' AND ' : '')

        result.where += `${and} paper_events.id = ANY($${count}::bigint[])`
        result.params.push(visibleEventIds)

        // ======== END Visibility ============================================

        if ( query.paperVersionId) {
            count += 1
            and = ( count > 1 ? ' AND ' : '')

            result.where += `${and} paper_events.paper_version_id= $${count}`
            result.params.push(query.paperVersionId)
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
         * 1. Non-logged in users may only view visible, committed events.
         * 2. Logged in users may view visible committed events and events in
         * progress.
         *
         * These constraints are enforced in `PaperController::buildQuery()`.
         * 
         * ********************************************************************/
        
        const paperId = request.params.paperId
        const currentUser = request.session.user

        const { where, params, order, emptyResult, requestedRelations } = await this.parseQuery(
            request.session, 
            request.query,
            `paper_events.paper_id = $1`,
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
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         * 2. Ability to update visibility is controlled by event-type and
         * journal model.  This is managed in PaperEventService.
         *
         * These constraints are enforced in `PaperController::buildQuery()`.
         * 
         * ********************************************************************/

        const user = request.session.user
        const paperId = request.params.paperId
        const eventId = request.params.eventId

        const event = request.body
        event.id = eventId

        if ( ! user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Only authenticated users may update event visibility.`)
        }

        const canEdit = await this.paperEventService.canEditEvent(user, eventId)
        if ( ! canEdit ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to edit visibility on an event they're not authorized to edit.`)
        }

        if ( ! event.visibility ) {
            throw new ControllerError(400, 'missing-fields',
                `User(${user.id}) attempted to update Event(${event.id}), but failed to include visibility.`)
        }

        /**********************************************************************
         * Permissions Checking and Validation Complete
         *  Execute the Patch 
         **********************************************************************/

         await this.paperEventDAO.updateEvent(event)

        const results = await this.paperEventDAO.selectEvents('WHERE paper_events.id = $1', [ event.id ])
        if ( ! results.dictionary[event.id] ) { 
            throw new ControllerError(500, 'server-error',
                `Event(${event.id}) not found after update!`)
        }
        const entity = results.dictionary[event.id]

        const relations = await this.getRelations(user, results)

        return response.status(200).json({
            entity: entity,
            relations: relations
        })
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
            paper_events.status = 'committed' AND (
                (paper_events.submission_id = ANY($1::bigint[]) 
                    OR paper_events.submission_id = ANY($2::bigint[]))
                AND (paper_events.type = 'paper:new-version'
                    OR paper_events.type = 'submission:new-review'
                    OR paper_events.type = 'submission:new')
            )
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
