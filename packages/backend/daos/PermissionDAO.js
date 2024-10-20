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
import { DAO } from './DAO'

export class PermissionDAO extends DAO {

    constructor(core) {
        super(core)

        this.fieldMap = {
            'id': {
                required: false,
                key: 'id'
            },
            'entity': {
                required: true,
                key: 'entity'
            },
            'action': {
                required: true,
                key: 'action'
            },
            'user_id': {
                required: false,
                key: 'userId'
            },
            'role_id': {
                required: false,
                key: 'roleId'
            },
            'paper_id': {
                rquired: false,
                key: 'paperId'
            },
            'paper_version_id': {
                required: false,
                key: 'paperVersionId'
            },
            'event_id': {
                required: false,
                key: 'event_id'
            },
            'review_id': {
                required: false,
                key: 'review_id'
            },
            'paper_comment_id': {
                required: false,
                key: 'paperCommentId'
            },
            'submission_id': {
                required: false,
                key: 'submissionId'
            },
            'journal_id': {
                required: false,
                key: 'journalId'
            }
        }

    }

    /*
     * @return {string}
     */
    getPermissionsSelectionString() {
        return `
            permissions.id as "Permission_id", 
            permissions.entity as "Permission_entity",
            permissions.action as "Permission_action",
            permissions.user_id as "Permission_userId",
            permissions.role_id as "Permission_roleId",
            permissions.paper_id as "Permission_paperId",
            permissions.paper_version_id as "Permission_paperVersionId",
            permissions.event_id as "Permission_eventId",
            permissions.review_id as "Permission_reviewId",
            permissions.paper_comment_id as "Permission_paperCommentId",
            permissions.submission_id as "Permission_submissionId",
            permissions.journal_id as "Permission_journalId",
            permissions.created_date as "Permission_createdDate",
            permissions.updated_date as "Permission_updatedDate"
        `
    }

    /**
     * @return {any}
     */
    hydratePermission(row) {
        return {
            id: row.Permissions_id,
            entity: row.Permission_entity,
            action: row.Permission_action,
            userId: row.Permission_userId,
            roleId: row.Permission_roleId,
            paperId: row.Permission_paperId,
            paperVersionId: row.Permission_paperVersionId,
            eventId: row.Permission_eventId,
            reviewId: row.Permission_reviewId,
            paperCommentId: row.Permission_paperCommentId,
            submissionId: row.Permission_submissionId,
            journalId: row.Permission_journalId,
            createdDate: row.Permission_createdDate,
            updatedDate: row.Permission_updatedDate
        }
    }

    /**
     * @return dictionary: { [id: string]: any, list: any[]} 
     */
    hydratePermissions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            dictionary[row.Permission_id] = this.hydratePermission(row)
            list.push(row.Permission_id)
        }

        return { dictionary: dictionary, list: list }
    }

    /**
     * @param {string} where
     * @param {any[]} params
     *
     * @return {Promise<any>}
     */
    async selectPermissions(where, params) {
        where = where ? `WHERE ${where}` : ''
        params = params ? params : []
        
        const sql = `
            SELECT
                ${this.getPermissionsSelectionString()}
            FROM permissions
                LEFT OUTER JOIN user_roles ON user_roles.role_id = permissions.role_id
            ${where}
        ` 

        const results = await this.core.database.query(sql, params)
        return this.hydratePermissions(results.rows)
    }

    /**
     * @return {Promise<void>}
     */
    async insertPermissions(permissions) {
        await this.insert('Permission', 'permissions', this.fieldMap, permissions)
    }
}
