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
import { Core } from '@danielbingham/peerreview-core'
import Migration from './Migration'

/**
 * Add tables to support roles and permissions.
 */
export default class RolesAndPermissionsMigration extends Migration {
    constructor(core: Core) {
        super(core)
    }

    /**
     * Do any setup necessary to initialize this migration.
     *
     * This *should not impact data*.  Only steps that have no impact or no
     * risk to user data should happen here.
     *
     * These steps also need to be fully backwards compatible, and
     * non-destructively rolled back.
     *
     * So here we can create a new table, add a column with null values to a
     * table (to be populated later), create a new ENUM, etc.
     */
    async initialize(): Promise<void> {
        try {
            await this.core.database.query(`
CREATE TYPE permission_type AS ENUM(
    'Papers:create',

    'Paper:view', 
    'Paper:edit', 
    'Paper:delete',
    'Paper:identify', 
    'Paper:review', 
    'Paper::comment', 

    'Paper:version:view',
    'Paper:version:edit',
    'Paper:version:delete',
    'Paper:version:review',
    'Paper:version:comment',

    'Paper:versions:create',
    'Paper:versions:view',
    'Paper:versions:edit',
    'Paper:versions:delete',
    'Paper:versions:review',
    'Paper:versions:comment',

    'Paper:version:events:view',
    'Paper:version:events:edit',
    'Paper:version:events:identify',

    'Paper:event:view', 
    'Paper:event:edit', 
    'Paper:event:identify', 

    'Paper:events:view',
    'Paper:events:edit',
    'Paper:events:identify',

    'Paper:review:view',
    'Paper:review:identify',
    'Paper:review:edit',
    'Paper:review:comment',

    'Paper:reviews:view',
    'Paper:reviews:identify',
    'Paper:reviews:edit',
    'Paper:reviews:comment',

    'Paper:comment:view',
    'Paper:comment:edit',
    'Paper:comment:identify',

    'Paper:comments:view',
    'Paper:comments:edit',
    'Paper:comments:identify',

    'Paper:submission:view',
    'Paper:submission:edit',

    'Paper:submissions:view',
    'Paper:submissions:edit',

    'Journal:entity:view',
    'Journal:entity:edit',

    'Journal:member:view',
    'Journal:member:edit',

    'Journal:membership:view',
    'Journal:membership:edit',

    'Journal:settings:view',
    'Journal:settings:edit',

    'Journal:submission:view',
    'Journal:submission:edit',

    'Journal:submissions:view',
    'Journal:submissions:edit',

    'Journal:submissions:paper:view',
    'Journal:submissions:paper:identify',
    'Journal:submissions:paper:review',
    'Journal:submissions:paper:comment',

    'Journal:submissions:reviews:view',
    'Journal:submissions:reviews:edit',
    'Journal:submissions:reviews:identify',

    'Journal:assignedSubmissions:view',
    'Journal:assignedSubmissions:edit',

    'Journal:assignedSubmissions:paper:identify',
    'Journal:assignedSubmissions:paper:review',
    'Journal:assignedSubmissions:paper:comment'

    'Journal:assignedSubmissions:reviews:view',
    'Journal:assignedSubmissions:reviews:edit',
    'Journal:assignedSubmissions:reviews:identify'
)
            `, [])

            await this.core.database.query(`
CREATE TABLE user_permissions (
    user_id bigint  REFERENCES users(id),
    permission permission_type,

    paper_id bigint REFERENCES papers(id) DEFAULT null,
    version int DEFAULT null,
    event_id bigint REFERENCES paper_events(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT null,
    paper_comment_id    bigint REFERENCES paper_comments(id) DEFAULT NULL,
    submission_id   bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL
)
            `, [])

            await this.core.database.query(`
CREATE TYPE role_type AS ENUM('public', 'author', 'editor', 'reviewer');
            `, [])

            await this.core.database.query(`
CREATE TABLE roles (
    id  bigserial PRIMARY KEY,
    name    varchar(1024),
    short_description varchar(1024),
    type role_type,
    is_owner boolean,

    description text,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL,
    paper_id    bigint REFERENCES papers(id) DEFAULT NULL
)
            `, [])

            await this.core.database.query(`
INSERT INTO roles (name, type, description) VALUES ('public', 'public', 'The general public.')
            `, [])

            await this.core.database.query(`
CREATE TABLE role_permissions (
    role_id bigint REFERENCES roles(id) DEFAULT NULL,
    permission permission_type,

    paper_id bigint REFERENCES papers(id) DEFAULT null,
    version int DEFAULT null,
    event_id bigint REFERENCES paper_events(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT null,
    paper_comment_id    bigint REFERENCES paper_comments(id) DEFAULT NULL,
    submission_id   bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL
)
            `, [])


            await this.core.database.query(`
INSERT INTO role_permissions (role_id, permission)
    SELECT roles.id, 'Papers:create' FROM roles WHERE roles.name = 'public'
            `, [])

            await this.core.database.query(`
CREATE TABLE user_roles (
    role_id bigint REFERENCS roles(id) DEFAULT NULL,
    user_id bigint REFERENCES users(id) DEFAULT NULL
)
            `, [])

        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`DROP TYPE IF EXISTS permission_type`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS user_permissions`, [])

                await this.core.database.query(`DROP TYPE IF EXISTS role_type`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS role`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS role_permissions`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS user_roles`, [])
            })
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`DROP TYPE IF EXISTS permission_type`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS user_permissions`, [])

            await this.core.database.query(`DROP TYPE IF EXISTS role_type`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS role`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS role_permissions`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS user_roles`, [])
        } catch (error) {
            await this.handleError(error)
        }
    }

    /**
     * Execute the migration.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> { 
        try {
            await this.core.database.query(`
INSERT INTO roles (name, short_description, type, is_owner, description, paper_id)
    SELECT 'corresponding-author', 'Corresponding Author', 'author', true, 'One of this paper's corresponding authors.', papers.id FROM papers
            `, [])

            await this.core.database.query(`
INSERT INTO roles (name, short_description, type, is_owner, description, paper_id)
    SELECT 'author', 'Author', 'author', false, 'One of this paper's authors.', papers.id FROM papers
            `, [])

            await this.core.database.query(`
INSERT INTO user_roles (role_id, user_id)
    SELECT roles.id, paper_authors.user_id FROM roles 
        LEFT OUTER JOIN paper_authors ON roles.paper_id = paper_authors.paper_id
            WHERE roles.name = 'corresponding-author' AND paper_authors.owner = TRUE
            `, [])

            await this.core.database.query(`
INSERT INTO user_roles (role_id, user_id)
    SELECT roles.id, paper_authors.user_id FROM roles 
        LEFT OUTER JOIN paper_authors ON roles.paper_id = paper_authors.paper_id
            WHERE roles.name = 'author' AND paper_authors.owner = FALSE 
            `, [])

        } catch (error ) {
            await this.handleError(error, async () => {
                await this.core.database.query(`
DELETE FROM roles WHERE name = 'corresponding-author' or name = 'author'
                `, [])

                await this.core.database.query(`
DELETE FROM user_roles
                `, [])
            })
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { 
        try {
            await this.core.database.query(`
                DELETE FROM roles WHERE name = 'corresponding-author' or name = 'author'
            `, [])

            await this.core.database.query(`
                DELETE FROM user_roles
            `, [])

        } catch(error) {
            await this.handleError(error)
        }
    }
}
