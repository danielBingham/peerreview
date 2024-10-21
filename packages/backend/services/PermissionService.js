/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

const PermissionDAO = requre('../daos/PermissionDAO')

const ServiceError = require('../errors/ServiceError')

module.exports = class PermissionService {
    constructor(core) {
        this.core = core

        this.permissionDAO = new PermissionDAO(this.core)

        this.publicRoleId = null
    }

    /**
     * @return {Promise<string>}
     */
    async getPublicRoleId() {
        if ( this.publicRoleId !== null ) {
            return this.publicRoleId
        }

        const results = await this.core.database.query(
            `SELECT id FROM roles WHERE name='public'`, 
            []
        )

        if ( results.rows.length <= 0 ) {
            throw new ServiceError('missing-public', 'Failed to find the public role id!')
        }

        this.publicRoleId = results.rows[0].id
        return this.publicRoleId
    }

    addContextSQL(query, context) {
        const contextMap = {
            paperId: 'paper_id',
            paperVersionId: 'paper_version_id',
            eventId: 'event_id',
            reviewId: 'review_id',
            paperCommentId: 'paper_comment_id',
            submissionId: 'submission_id',
            journalId: 'journal_id'
        }
        for(const [key, value] of Object.entries(context)) {
            if ( ! ( key in contextMap ) ) {
                throw new ServiceError('invalid-context',
                    `Invalid context '${key}'.`)
            }

            query.where += ` AND ${contextMap[key]} = ${query.params.length+1}`
            query.params.push(value)
        }
        return query 
    }

    /**
     * Can `user` perform `action` on `entity` identified by `context.
     *
     * @returns {Promise<boolean>} True if the `user` can perform `action` on `entity`
     * identified by `context`, false otherwise.
     */
    async can(user, action, entity, context) {
        const query = {
            where:  'permissions.entity = $1 and permissions.action = $2',
            params: [ entity, action ]
        }

        const publicRoleId = await this.getPublicRoleId()

        if ( user ) {
            query.where += ` AND 
                ( permissions.user_id = $${query.params.length+1} 
                    OR user_roles.user_id = $${query.params.length+1} 
                    OR permissions.role_id = $${query.params.length+2}
                )`
            query.params.push(user.id)
            query.params.push(publicRoleId)
        }  else {
            query.where += ` AND permissions.role_id = $${query.params.length+1}`
            query.params.push(publicRoleId)
        }

        this.addContextSQL(query, context)

        const results = await this.permissionDAO.selectPermissions(query.where, query.params)

        return results.list.length > 0
    }

    /**
     * @returns {Promise<any[]>}
     */
    async get(user, entity, action, context) {
        const query = {
            where: '',
            params: []
        }

        const publicRoleId = await this.getPublicRoleId()

        if ( user ) {
            query.where += '(permissions.user_id = $1 OR user_roles.user_id = $1 OR permissions.role_id = $2)'
            query.params.push(user.id, publicRoleId)
        } else {
            query.where += 'permissions.role_id = $1'
            query.params.push(publicRoleId)
        }

        if ( entity && entity !== '*' ) {
            query.params.push(entity)
            query.where += ` AND permissions.entity = $${query.params.length}`
        }
        if ( action && action !== '*' ) {
            query.params.push(action)
            query.where += ` AND permissions.action = $${query.params.length}`
        }

        this.addContextSQL(query, context)

        const results = await this.permissionDAO.selectPermissions(query.where, query.params)
        return results.list.map((id) => results.dictionary[id])
    }

    async grant(permissions) {
        await this.insertPermissions(permissions)
    }
}
