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

import { Uuid } from 'uuid'

import ServiceError from '../errors/ServiceError'

import { RoleDAO } from '../daos/RoleDAO'

import { PermissionService } from './PermissionService'

export class RoleService {

    constructor(core) {
        this.core = core

        this.roleDAO = new RoleDAO(core)

        this.permissionService = new PermissionService(core)
    }

    /**
     * Grant a role to a user.
     *
     * @param {string} role The role name.
     * @param {number} userId The id of the user.
     * @param {Object} context The required context for the role being granted.
     *
     * @return {Promise<boolean>}
     */
    async grant(role, userId, context) {
        const sql = `SELECT id FROM roles WHERE name = $1`
        const params = [ role ]

        if ( context.paperId ) {
            sql += ` AND paper_id = $2`
            params.push(context.paperId)
        } else if ( context.journalId ) {
            sql += ` AND journal_id = $2`
            params.push(context.journalId)
        } else {
            throw new ServiceError('missing-context',
                `Roles may only be granted on papers or journals.`)
        }
            
        const roleResults = await this.database.query(sql, params)
        
        if ( roleResults.rows.length <= 0 ) {
            throw new ServiceError('missing-role',
                `No Role named ${role} exists for context.`)
        } else if ( roleResults.rows.length > 1 ) {
            throw new ServiceError('invalid-state',
                `Multiple Roles named ${role} exist for context!`)
        }

        const id = roleResults.rows[0].id

        await this.database.query(`
            INSERT INTO user_roles (role_id, user_id)
                VALUES ($1, $2)
        `, [ id, userId ])

        return true
    }

    /**
     * Create the initial roles for a paper and grant the initial permissions for those roles.
     *
     * @param {number} paperId
     *
     * @return {Promise<void>}
     */
    async createPaperRoles(paperId) {
        const correspondingAuthorId = Uuid.v4()
        const authorId = Uuid.v4()

        await this.roleDAO.insertRoles([
            { 
                id: correspondingAuthorId,
                name: 'Corresponding Author', 
                description: `One of this paper's corresponding authors.`,
                paperId: paperId
            }, 
            { 
                id: authorId,
                name: 'Author',
                description: `One of this paper's authors.`,
                paperId: paperId
            }
        ])

        await this.permissionService.grant([
            { entity:'Paper', action:'update', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'read', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'delete', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'grant', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'create', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'read', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'update', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'delete', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'grant', roleId:correspondingAuthorId, paperId:paperId }
        ])

        await this.permissionService.grant([
            { entity:'Paper', action:'read', roleId:authorId, paperId:paperId },
            { entity:'PaperVersion', action:'create', roleId:authorId, paperId:paperId },
            { entity:'PaperVersion', action:'read', roleId:authorId, paperId:paperId }
        ])
    }
}
     
