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

export class RoleDAO extends DAO {
    constructor(core) {
        super(core)

        this.fieldMap = {
            'roles': {
                'id': {
                    required: false,
                    key: 'id'
                },
                'name': {
                    required: true,
                    key: 'name'
                },
                'description': {
                    required: true,
                    key: 'description'
                },
                'journal_id': {
                    required: false,
                    key: 'journalId'
                },
                'paper_id': {
                    required: false,
                    key: 'paperId'
                }
            },
            'user_roles': {
                'user_id': {
                    required: true,
                    key: 'userId'
                },
                'role_id': {
                    required: true,
                    key: 'roleId'
                }
            }
        }
    }

    /**
     * @return string
     */
    getRoleSelectionString() {
        return `
            roles.id as "Role_id",
            roles.name as "Role_name",
            roles.description as "Role_description",
            roles.journal_id as "Role_journalId",
            roles.paper_id as "Role_paperId",
            roles.created_date as "Role_createdDate",
            roles.updated_date as "Role_updatedDate"
        `
    }

    /**
     * @return any
     */
    hydrateRole(row) {
        return {
            id: row.Role_id,
            name: row.Role_name,
            description: row.Role_description,
            journalId: row.Role_journalId,
            paperId: row.Role_paperId,
            createdDate: row.Role_createdDate,
            updatedDate: row.Role_updatedDate
        }
    }
    
    /**
     * @return { dictionary: { [id: string]: any }, list: number[] }
     */
    hydrateRoles(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            dictionary[row.Role_id] = this.hydrateRole(row)
            list.push(row.Role_id)
        }

        return { dictionary: dictionary, list: list }
    }


    /**
     * @return Promise<{ dictionary: [id: string]: any, list: number[] }>
     */
    async selectRoles(where, params) {
        where = where ? `WHERE ${where}` : ''
        params = params ? params : [] 

        const results = await this.core.database.query(`
            SELECT
                ${this.getRoleSelectionString()}
            FROM roles
            ${where}
        `, params)

        return this.hydrateRoles(results.rows)
    }

    /**
     * @return Promise<any>
     */
    async getRole(id) {
        const results = await this.selectRoles(`roles.id = $1`, [ id ])
        return results.dictionary[id]
    }


    /**
     * @return Promise<void>
     */
    async insertRoles(roles) {
        await this.insert('Role', 'roles', this.fieldMap['roles'], roles)
    }

    /**
     * @return Promise<void>
     **/
    async insertUserRoles(userRoles) {
        await this.insert('UserRole', 'user_roles', this.fieldMap['userRoles'], userRoles)
    }
}
