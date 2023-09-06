const { PaperEventDAO, UserDAO, ReviewDAO, JournalSubmissionDAO } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PaperEventController {


    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)
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

        console.log(results)

        results.relations = await this.getRelations(request.session.user, results, requestedRelations)

        return response.status(200).json(results)
    }

    async patchEvent(request, response) {

        // Not yet implemented.
        return response.status(501).send()
    }

}
