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
import { Core, ServiceError } from '@danielbingham/peerreview-core' 

import { User } from '@danielbingham/peerreview-model'

import { PaperPermissionService } from './permissions/PaperPermissionService'

export interface EntityData {
    paper_id?: number
    version?: number
    event_id?: number
    review_id?: number
    comment_id?: number
    submission_id?: number
}


export class PermissionService {
    core: Core

    papers: PaperPermissionService

    entityFields: { [ entity: string]: string[] }

    constructor(core: Core) {
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

    entityDataHasRequiredFields(entity: string, entityData: EntityData): boolean {
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

    async canPublic(action: string, entity: string, entityData: EntityData): Promise<boolean> {
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

    async can(user: User, action: string, entity: string, entityData: EntityData): Promise<boolean> {
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
