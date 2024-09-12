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
import { Core } from '@journalhub/core' 
import { Paper, User } from '@journalhub/model'

export class PaperPermissionService {
    core: Core

    constructor(core: Core) {
        this.core = core
    }

    /**
     * Create the roles for the paper.
     */
    async createRoles(paper: Paper): Promise<void> {
        await this.core.database.query(`
        INSERT INTO roles (name, short_description, description, type, is_owner, paper_id)
            VALUES ('corresponding-author', 'Corresponding Author', 'An author responsible for corresponding on submissions.  Has full permissions over the paper.', 'author', true, $1),
            ('author', 'Author', 'An author on the paper.', 'author', false, $1)
        `, [ paper.id ])

        const correspondingAuthorRoleResults = await this.core.database.query(`
            SELECT id FROM roles WHERE name = 'corresponding-author' AND paper_id = $1
        `, [ paper.id ])

        const correspondingAuthorRoleId = correspondingAuthorRoleResults.rows[0].id

        await this.core.database.query(`
            INSERT INTO role_permissions
                    (role_id, permission, paper_id)
                VALUES
                    ($1, 'Paper:view', $2),
                    ($1, 'Paper:edit', $2),
                    ($1, 'Paper:delete', $2),
                    ($1, 'Paper:identify', $2),
                    ($1, 'Paper:review', $2),
                    ($1, 'Paper:comment', $2),
                    ($1, 'Paper:versions:create', $2)
        `, [ correspondingAuthorRoleId, paper.id ])

        const authorRoleResults = await this.core.database.query(`
            SELECT id FROM roles WHERE name = 'author' AND paper_id = $1
        `, [ paper.id ])

        const authorRoleId = authorRoleResults.rows[0].id

        await this.core.database.query(`
            INSERT INTO role_permissions
                    (role_id, permission, paper_id)
                VALUES
                    ($1, 'Paper:view', $2),
                    ($1, 'Paper:identify', $2),
                    ($1, 'Paper:review', $2),
                    ($1, 'Paper:comment', $2)
        `, [ authorRoleId, paper.id ])
    }

    async assignRoles(paper: Paper): Promise<void> {
        const roleResults = await this.core.database.query(`
            SELECT id, name FROM roles WHERE paper_id = $1
        `, [ paper.id ])

        const roleMap = roleResults.rows.reduce((map, row) => map[row.name] = row.id, {})

        let sql = `INSERT INTO user_roles (role_id, user_id) VALUES `
        let params = []
        let count = 1
        for(const author of paper.authors) {
            if ( count > 1 ) {
                sql += ', '
            }
            sql += `($${count}, $${count})`
            params.push(roleMap[author.role], author.userId)
        }

        await this.core.database.query(sql, params)
    }

    /**
     * Get an array with the ids of papers visible to the given user.
     *
     * @param {User} user   The user we want to get visible papers for.
     */
    async getVisiblePaperIds(user: User): Promise<number[]> {
        let results = null
        if ( user ) {
            const sql = `
                SELECT 
                    paper_id
                FROM permissions
                    WHERE user_id = $1 AND permission = 'Paper:view'
            `

            results = await this.core.database.query(sql, [ user.id ])
        } else {
            const sql = `
                SELECT
                    paper_id
                FROM permissions
                    LEFT OUTER JOIN roles ON permissions.role_id = roles.id
                WHERE roles.name = 'public' AND permission = 'Paper:view'

            `

        }

        if ( ! results || ! results.rows || results.rows.length <= 0 ) {
            return []
        }
        return results.rows.map((r) => r.paper_id)
    }
}
