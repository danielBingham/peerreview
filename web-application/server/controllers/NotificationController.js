
const { NotificationDAO } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class NotificationController {

    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
    }

    async getNotifications(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const userId = request.session.user.id

        const results = await this.notificationDAO.selectNotifications('WHERE user_notifications.user_id = $1', [ userId ])

        results.meta = {}
        results.relations = []

        return response.status(200).json(results)
    }

    async patchNotification(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const id = request.params.id
        const notification = request.body

        notification.id = id

        const updateResult = await this.notificationDAO.updateNotification(notification)
        if ( ! updateResult ) {
            throw new ControllerError(400, 'no-content', `Failed to update a notification because no content was provided.`)
        }

        const results = await this.notificationDAO.selectNotifications('WHERE user_notifications.id = $1', [ id ] )
        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Notification(${id}) doesn't exist after update.`)
        }

        return response.status(200).json({
            entity: entity,
            relations: []
        })
    }

}
