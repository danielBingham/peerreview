
const PaperPermissionService = require('./permissions/PaperPermissionService')

module.exports = class PermissionService {
    constructor(core) {
        this.core = core

        this.papers = new PaperPermissionService(core)

        this.entityFields = {
            'Papers': [ ],
            'Paper': [ 'paper_id' ],
            'Paper:version': [ 'paper_id', 'version' ],
            'Paper:event': [ 'paper_id', 'event_id' ],
            'Paper:review': [ 'paper_id', 'version', 'review_id' ],
            'Paper:comment': [ 'paper_id', 'version', 'comment_id' ],
            'Paper:submission': [ 'paper_id', 'version', 'submission_id' ]
        }
    }

    entityDataHasRequiredFields(entity, entityData) {
        if ( ! (entity in this.entityFields ) ) {
            throw new Error(`"${entity}" is not an entity for which permissions can be defined.`)
        }

        const requiredFields = this.entityFields[entity]

        let missingField = false
        for(const field of requiredFields) {
            if ( ! (field in entityData) ) {
                missingField = true 
            }
        }
        return ! missingField
    }

    async canPublic(action, entity, entityData) {
        if ( ! this.entityDataHasRequiredFields(entity, entityData) ) {
            throw new Error(`Entity data for "${entity}" is missing required fields.`) 
        }

        let where = `role.name = 'public' AND permission = '${entity}:${action}'` 
        let params = []
        let count = 1

        for(const [field, value] of Object.entries(entityData)) {
            where += ` AND ${field} = $${count}`
            params.push(value)
        }

        const sql = `
            SELECT role_permissions.permission
                FROM roles
                    LEFT OUTER JOIN role_permissions ON roles.id = role_permissions.role_id
            WHERE ${where}
        `

        const results = await this.core.database.query(sql, params)
        if (results.rows.length <= 0 ) {
            return false
        } else {
            return true
        }
    }

    async can(user, action, entity, entityData) {
        if ( ! user ) {
            return await this.canPublic(action, entity, entityData)
        }

        if ( ! this.entityDataHasRequiredFields(entity, entityData) ) {
            throw new Error(`Entity data for "${entity}" is missing required fields.`) 
        }

        let where = `(user_permissions.permission = '${entity}:${action}' OR role_permissions.permission = '${entity}:${action}')` 
        let params = []
        let count = 1

        for(const [field, value] of Object.entries(entityData)) {
            where += ` AND ${field} = $${count}`
            params.push(value)
        }

        const sql = `
            SELECT users.id, user_permissions.permission, role_permissions.permission
                FROM users
                    LEFT OUTER JOIN user_permissions ON users.id = user_permissions.user_id
                    LEFT OUTER JOIN user_roles ON users.id = user_roles.user_id
                    LEFT OUTER JOIN role_permissions ON user_roles.role_id = role_permissions.role_id
            WHERE ${where}
        `

        const results = await this.core.database.query(sql, params)
        if (results.rows.length <= 0 ) {
            return false
        } else {
            return true
        }
    }
}
