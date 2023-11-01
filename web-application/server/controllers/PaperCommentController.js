
const { PaperCommentDAO, PaperDAO, PaperEventDAO, PaperService, PaperEventService, NotificationService } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PaperCommentsController {

    constructor(core) {
        this.core = core

        this.paperDAO = new PaperDAO(core)
        this.paperCommentDAO = new PaperCommentDAO(core)
        this.paperEventDAO = new PaperEventDAO(core)
       
        this.paperService = new PaperService(core)
        this.paperEventService = new PaperEventService(core)
        this.notificationService = new NotificationService(core)
    }

    async getRelations(currentUser, results) {
        const relations = {} 

        const eventResults = await this.paperEventDAO.selectEvents(
            'WHERE paper_events.paper_comment_id = ANY($1::bigint[])', 
            [ results.list ]
        )
        relations.events = eventResults.dictionary

        return relations
    }


    async postPaperComments(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint:
         *
         * 1. CurrentUser be logged in.
         * 2. Paper(:paperId) exists.
         * 3. CurrentUser canView Paper(:paperId) 
         *
         * ***********************************************************/

        const paperId = request.params.paperId
        const paperComment = request.body

        paperComment.paperId = paperId

        const currentUser = request.session.user

        // 1. CurrentUser be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to post a new Paper Comment.`)
        }


        // 2. Paper(:paperId) exists.
        // 3. CurrentUser canView Paper(:paperId) 
        // PaperService::canViewPaper also performs the existence check.
        const canView = await this.paperService.canViewPaper(currentUser, paperId)
        if ( ! canView ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment to Paper(${paperId}) that doesn't exist or they can't view.`)
        }

        /**********************************************************************
         * Checks complete
         *  POST the comment
         **********************************************************************/
        
        if ( ! paperComment.status ) {
            paperComment.status = 'in-progress'
        } else if ( paperComment.status == 'reverted' || paperComment.status == 'edit-in-progress' ) {
            paperComment.status = 'in-progress'
        }
       
        // We're only ever allowed to comment on the current version.
        const paperVersionResults = await this.core.database.query(`
            SELECT version FROM paper_versions WHERE paper_versions.paper_id = $1 ORDER BY version DESC
        `, [ paperComment.paperId ])

        paperComment.paperVersion = paperVersionResults.rows[0].version


        const id = await this.paperCommentDAO.insertPaperComment(paperComment)

        // ======== Collect return data and handle events and notifications ===
        
        const results = await this.paperCommentDAO.selectPaperComments('WHERE paper_comments.id = $1', [ id ])
        const entity = results.dictionary[id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PaperComment(${id}) not found after insert.`)
        }


        const event = {
            paperId: paperId,
            actorId: currentUser.id,
            status: entity.status == 'in-progress' ? 'in-progress' : 'committed',
            type: 'new-comment',
            paperCommentId: entity.id
        }
        await this.paperEventService.createEvent(currentUser, event)

        if ( entity.status == 'committed' ) {
            // ==== Notifications =============================================
           
            this.notificationService.sendNotifications(
                request.session.user,
                'new-comment',
                {
                    comment: entity
                }
            )

            // ==== END Notifications =========================================
        }

        const relations = await this.getRelations(currentUser, results)

        return response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async patchPaperComment(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint:
         *
         * 1. CurrentUser be logged in.
         * 2. Paper(:paperId) exists.
         * 3. CurrentUser canView Paper(:paperId) 
         * 4. PaperComment(:paperCommentId) must exist
         * 5. PaperComment(:paperCommentId).paperId must equal :paperId
         * 6. CurrentUser is author of PaperComment(:paperCommentId)
         *
         * ***********************************************************/

        const paperId = request.params.paperId
        const paperCommentId = request.params.paperCommentId

        const paperComment = request.body
        paperComment.id = paperCommentId

        const currentUser = request.session.user

        // 1. CurrentUser be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to post a new Paper Comment.`)
        }

        // 2. Paper(:paperId) exists.
        // 3. CurrentUser canView Paper(:paperId) 
        // PaperService::canViewPaper also performs the existence check.
        const canView = await this.paperService.canViewPaper(currentUser, paperId)
        if ( ! canView ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment to Paper(${paperId}) that doesn't exist or they can't view.`)
        }

        const existingResults = await this.paperCommentDAO.selectPaperComments('WHERE paper_comments.id = $1', [ paperCommentId ])
        const existing = existingResults.dictionary[paperCommentId]

        // 4. PaperComment(:paperCommentId) must exist
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to PATCH PaperComment(${paperCommentId}), but it didn't exist.`)
        }
       
        // 5. PaperComment(:paperCommentId).paperId must equal :paperId
        if ( existing.paperId != paperId ) {
            throw new ControllerError(400, 'wrong-paper',
                `User(${currentUser}) attempted to patch PaperComment(${paperCommentId}) which belongs to Paper(${existing.paperId}) not Paper(${paperId}).`)
        }

        // 6. CurrentUser is author of PaperComment(:paperCommentId)
        if ( existing.userId != currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `user(${currentUser.id}) attempted to PATCH PaperComment(${paperCommentId}), but they are not the author.`)
        }

        /**********************************************************************
         * Checks complete
         *  PATCH the comment
         **********************************************************************/

        if ( paperComment.status == 'committed' && (existing.status == 'in-progress' || existing.status == 'edit-in-progress')) {
            await this.paperCommentDAO.insertPaperCommentVersion(paperComment)

            if ( existing.status == 'in-progress') {
                paperComment.committedDate = true
            }

            await this.paperCommentDAO.updatePaperComment(paperComment)
        } else if ( paperComment.status == 'reverted' ) {
            await this.paperCommentDAO.revertVersion(paperComment.id)
        } else {
            await this.paperCommentDAO.updatePaperComment(paperComment)
        }

        // ======== Collect return data and handle events and notifications ===

        const results = await this.paperCommentDAO.selectPaperComments('WHERE paper_comments.id = $1', [ paperCommentId ])
        const entity = results.dictionary[paperCommentId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PaperComment(${paperCommentId}) not found after update.`)
        }


        // Update the event
        if ( paperComment.status == 'committed' && existing.status == 'in-progress' ) {
            await this.core.database.query(`
                UPDATE paper_events SET status = 'committed' WHERE ( type = 'paper:new-comment' OR type= 'submission:new-comment' ) AND paper_comment_id = $1
            `, [ paperComment.id ])

            // ==== Notifications =============================================
           
            this.notificationService.sendNotifications(
                request.session.user,
                'new-comment',
                {
                    comment: entity
                }
            )

            // ==== END Notifications =========================================
        }


        // We need to get the relations after we update the event - because the
        // event is one of the relations.
        const relations = await this.getRelations(currentUser, results)

        return response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deletePaperComment(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint:
         *
         * 1. CurrentUser be logged in.
         * 2. Paper(:paperId) exists.
         * 3. CurrentUser canView Paper(:paperId) 
         * 4. PaperComment(:paperCommentId) must exist
         * 5. CurrentUser is author of PaperComment(:paperCommentId)
         *
         * ***********************************************************/

        const paperId = request.params.paperId
        const paperCommentId = request.params.paperCommentId

        const currentUser = request.session.user

        // 1. CurrentUser be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to post a new Paper Comment.`)
        }

        // 2. Paper(:paperId) exists.
        // 3. CurrentUser canView Paper(:paperId) 
        // PaperService::canViewPaper also performs the existence check.
        const canView = await this.paperService.canViewPaper(currentUser, paperId)
        if ( ! canView ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment to Paper(${paperId}) that doesn't exist or they can't view.`)
        }

        const existingResults = await this.paperCommentDAO.selectPaperComments('WHERE paper_comments.id = $1', [ paperCommentId ])
        const existing = existingResults.dictionary[paperCommentId]

        // 4. PaperComment(:paperCommentId) must exist
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to PATCH PaperComment(${paperCommentId}), but it didn't exist.`)
        }

        // 5. CurrentUser is author of PaperComment(:paperCommentId)
        if ( existing.userId != currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `user(${currentUser.id}) attempted to PATCH PaperComment(${paperCommentId}), but they are not the author.`)
        }

        /**********************************************************************
         * Checks complete
         *  DELETE the comment
         **********************************************************************/

        await this.paperCommentDAO.deletePaperComment(paperCommentId)

        return response.status(200).json({ id: paperCommentId })
    }
}
