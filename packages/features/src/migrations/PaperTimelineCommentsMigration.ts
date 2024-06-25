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
 * Add tables to support comments on the Paper Event Timeline.
 */
export default class PaperTimelineCommentsMigration extends Migration {
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
                CREATE TYPE paper_comments_status AS ENUM('in-progress', 'committed', 'edit-in-progress');
            `, [])

            await this.core.database.query(`
                CREATE TABLE paper_comments (
                    id          bigserial PRIMARY KEY,
                    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
                    paper_version     bigint,
                    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
                    status      paper_comments_status,
                    content     text,
                    created_date    timestamptz,
                    updated_date    timestamptz,
                    committed_date  timestamptz DEFAULT NULL
                );
            `, [])


            await this.core.database.query(`
                CREATE INDEX paper_comments__paper_id ON paper_comments (paper_id);
            `, [])

            await this.core.database.query(`
                CREATE INDEX paper_comments__user_id ON paper_comments (user_id);
            `, [])
            
            await this.core.database.query(`
                CREATE TABLE paper_comment_versions (
                    paper_comment_id    bigint REFERENCES paper_comments(id) ON DELETE CASCADE,
                    version             int DEFAULT 1,
                    content             text,
                    created_date        timestamptz,
                    updated_date        timestamptz
                );
            `, [])
            
            await this.core.database.query(`
                CREATE INDEX paper_comment_versions__paper_comment_id ON paper_comment_versions (paper_comment_id);
            `, [])

            await this.core.database.query(`
                CREATE INDEX paper_comment_versions__version ON paper_comment_versions (version);
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events ADD COLUMN paper_comment_id bigint
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events ADD FOREIGN KEY (paper_comment_id) REFERENCES paper_comments(id) ON DELETE CASCADE
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events ALTER COLUMN paper_comment_id SET DEFAULT NULL
            `, [])

            await this.core.database.query(`
                ALTER TYPE paper_event_types ADD VALUE IF NOT EXISTS 'paper:new-comment'
            `, [])

            await this.core.database.query(`
                ALTER TYPE paper_event_types ADD VALUE IF NOT EXISTS 'submission:new-comment'
            `, [])
        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_comment_id`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS paper_comment_versions__paper_comment_id`, [])
                await this.core.database.query(`DROP INDEX IF EXISTS paper_comment_verions__version`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__paper_id`, [])
                await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__user_id`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS paper_comments_status `, [])
            })
        }
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_comment_id`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS paper_comment_versions__paper_comment_id`, [])
            await this.core.database.query(`DROP INDEX IF EXISTS paper_comment_verions__version`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__paper_id`, [])
            await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__user_id`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS paper_comments_status `, [])
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
                UPDATE paper_events SET paper_comment_id = NULL 
            `, [])
        } catch (error ) {
            this.handleError(error)
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { 
        try {
            await this.core.database.query(`
                DELETE FROM paper_events WHERE type='paper:new-comment' OR type='submission:new-comment'
            `, [])
        } catch(error) {
            this.handleError(error)
        }
    }
}
