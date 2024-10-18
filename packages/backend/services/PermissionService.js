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
const ServiceError = require('../errors/ServiceError')

module.exports = class PermissionService {
    constructor(core) {
        this.core = core
    }

    async getRoleIds(user) {
        let where = ''
        let params = []

        if ( user ) {
            where += 'OR user_roles.user_id = $1'
            params.push(user.id)
        }

        const roleResults = await this.core.database.query(`
            SELECT id FROM roles
                ${ user ? 'LEFT OUTER JOIN user_roles ON user_roles.role_id = roles.id' : ''}
            WHERE roles.name = 'public' ${where} 
        `, params) 

        return roleResults.rows.map((r) => r.id)
    }

    /**
     * Can `user` perform `action` on `entity` identified by `context.
     *
     * @returns {boolean} True if the `user` can perform `action` on `entity`
     * identified by `context`, false otherwise.
     */
    async can(user, action, entity, context) {
        let where = ''
        let params = [ entity, action ]

        const roleIds = await this.getRoleIds(user)
        if ( user ) {
            where = ` AND ( user_id = ${params.length+1} OR role_id = ANY(${params.length+2}::uuid[]))`
            params.push(user.id)
            params.push(roleIds)
        }  else {
            where = ` AND role_id = ANY(${params.length+1}::uuid[])`
            params.push(roleIds)
        }

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

            where += ` AND ${contextMap[key]} = ${params.length+1}`
            params.push(value)
        }

        const results = await this.core.database.query(`
            SELECT user_id, role_id 
                FROM permissions
                WHERE entity = $1 AND action = $2${where}
        `, params)


        return results.rows.length > 0
    }

    async let(user, action, entity, context) {

    }

    async has(user, role, context) {

    }

}
