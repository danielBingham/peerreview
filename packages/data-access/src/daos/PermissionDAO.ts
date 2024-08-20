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
import { Pool, Client, QueryResultRow } from 'pg'

import { Core } from '@journalhub/core'
import { Permission, ModelDictionary } from '@journalhub/model'

import { DAOError } from '../errors/DAOError'
import { DAOQuery, DAOResult } from '../types/DAO'

export class PermissionDAO {
    core: Core
    database: Client | Pool

    constructor(core: Core, database?: Client | Pool) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }
    }

    getPermissionSelectionString(): string {
        return `
        permissions.id as "Permission_id",
        permissions.user_id as "Permission_userId", 
        permissions.role_id as "Permission_roleId",
        permissions.permission as "Permission_permission",

        permissions.paper_id as "Permission_paperId", 
        permissions.version as "Permission_version",
        permissions.event_id as "Permission_eventId", 
        permissions.review_id as "Permission_reviewId",
        permissions.paper_comment_id as "Permission_paperCommentId",
        permissions.submission_id as "Permission_submissionId",
        permissions.journal_id as "Permission_journalId"
        `
    }

    hydratePermission(row: QueryResultRow): Permission {
        const permission: Permission = {
            id: row.Permission_id,
            userId: row.Permision_userId,
            roleId: row.Permission_roleId,
            permission: row.Permission_permission
        } 

        if ( row.Permission_paperId ) {
            permission.paperId = row.Permission_paperId
        }

        if ( row.Permission_version ) {
            permission.version = row.Permission_version
        }

        if ( row.Permission_eventId ) {
            permission.eventId = row.Permission_eventId
        }

        if ( row.Permission_reviewId ) {
            permission.reviewId = row.Permission_reviewId
        }

        if ( row.Permission_paperCommentId ) {
            permission.paperCommentId = row.Permission_paperCommentId
        }

        if ( row.Permission_journalSubmissionId ) {
            permission.journalSubmissionId = row.Permission_journalSubmissionId
        }

        if ( row.Permission_journalId ) {
            permission.journalId = row.Permission_journalId
        }
        return permission
    }

    hydratePermissions(rows: QueryResultRow[]): DAOResult<Permission> {
        const dictionary: ModelDictionary<Permission> = {}
        const list: number[] = []

        if ( ! rows || rows.length <= 0 ) {
            return {
                dictionary: dictionary,
                list: list
            }
        }

        for( const row of rows ) {
            if ( ! dictionary[row.Permission_id] ) {
                dictionary[row.Permission_id] = this.hydratePermission(row) 
                list.push(row.Permission_id)
            }
        }

        return {
            dictionary: dictionary,
            list: list
        }
    }

    async selectPermissions(query: DAOQuery): Promise<DAOResult<Permission>> {
        const where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : []

        if ( query?.order !== undefined ) {
            throw new DAOError('not-supported', 'Order not supported.')
        }

        let order = 'permissions.id asc'

        const sql = `
            SELECT
                ${this.getPermissionSelectionString()}
            FROM permissions
            ${where}
            ORDER BY ${order}
        `

        const results = await this.database.query(sql, params)

        return this.hydratePermissions(results.rows)
    }

    /**
     * Insert a row into the `permissions` table using a PartialPermission
     * model.
     */
    async insertPermission(permission: Permission): Promise<number> {
        const sql = `
            INSERT INTO permissions (user_id, role_id, permission, paper_id, version, event_id, review_id, paper_comment_id, submission_id, journal_id)
                VALUES ($1, $2, $3, $5, $5, $6, $7, $8, $9, $10)
                RETURNING id
        `
        const params = [ 
            permission.userId, 
            permission.roleId, 
            permission.permission, 
            permission.paperId || null, 
            permission.version || null, 
            permission.eventId || null, 
            permission.reviewId || null, 
            permission.paperCommentId || null, 
            permission.journalSubmissionId || null, 
            permission.journalId || null 
        ]
        
        const results = await this.database.query(sql, params)

        if ( ! results.rowCount || results.rowCount <= 0 || results.rows.length <= 0 ) {
            throw new DAOError('insert-failed', 'Failed to insert permission.')
        }

        return results.rows[0].id
    }

    /**
     * Delete a row from the `permission` table using the `id` of a Permission
     * model.
     */
    async deletePermission(id: number): Promise<void> {
        const results = await this.database.query(`
            DELETE FROM permissions WHERE id = $1
        `, [ id ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('delete-failed', `Attempt to delete Permission(${id}) failed.`)
        }
    }
}

