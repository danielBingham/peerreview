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
import Core from '../core'
import Migration from './Migration'

/**
 * Add tables to support user notifications.
 */
export default class NotificationsMigration extends Migration {
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
CREATE TYPE user_notification_type AS ENUM(

    /* ============ Paper Notifications ======================================= */
    /* User was added to a paper as an author. */
    'author:paper:submitted', 
    
    /* 
     * A new version was uploaded for a paper the user is an author, editor, or
     * reviewer on. 
     */
    'author:paper:new-version', 
    'reviewer:paper:new-version',

    /**
     * A paper the user is an author of was submitted as a preprint.
     */
    'author:paper:preprint-posted',

    /**
     * A review was posted to a paper that the user is an author of.
     */
    'author:paper:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    'author:paper:review-comment-reply',
    'reviewer:paper:review-comment-reply',

    /**
     * A comment was posted to the timeline of a paper the user is an author,
     * reviewer, or editor for. TODO
     */
    'author:paper:new-comment',
    'reviewer:paper:new-comment',
   
    /* ============ Journal Notifications ===================================== */
    /**
     * User has been added to a journal's team.
     */
    'journal-member:journal:invited',

    /**
     * Role in journal changed. TODO
     */
    'journal-member:journal:role-changed',

    /**
     * User removed from journal's team. TODO
     */
    'journal-member:journal:removed',

    /* ============ Submission Notifications ================================== */
    

    /**
     * A paper the user is an author of was submitted to a journal.
     * A journal the user is a managing editor of received a new submission.
     */
    'author:submission:new', 
    'editor:submission:new',

    /* 
     * A new version was uploaded for a submission the user is an editor, or
     * reviewer on. 
     */
    'author:submission:new-version',
    'reviewer:submission:new-version',
    'editor:submission:new-version',

    /**
     * A new review was submitted for a submission the user is editing.
     */ 
    'author:submission:new-review',
    'editor:submission:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    'author:submission:review-comment-reply',
    'reviewer:submission:review-comment-reply',
    'editor:submission:review-comment-reply',

    /**
     * A new timeline comment on a paper the user is a reviewer or editor for.
     */
    'author:submission:new-comment',
    'reviewer:submission:new-comment',
    'editor:submission:new-comment',

    /**
     * The status of a submission the user is an author of changed.
     */
    'author:submission:status-changed',
    'editor:submission:status-changed',

    /**
     * A user was (un)assigned as a reviewer to a paper. 
     */
    'reviewer:submission:reviewer-assigned',
    'reviewer:submission:reviewer-unassigned',

    /**
     * A user was (un)assigned as an editor to a paper.
     */
    'editor:submission:editor-assigned',
    'editor:submission:editor-unassigned'
);
            `, [])

            await this.core.database.query(`
CREATE TABLE user_notifications (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users(id) NOT NULL,
    type user_notification_type,
    description text,
    path varchar(1024),
    is_read boolean,
    created_date timestamptz,
    updated_date timestamptz
)
            `, [])

            await this.core.database.query(`
CREATE INDEX user_notifications__user_id ON user_notifications (user_id)
            `, [])
        
        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`DROP INDEX IF EXISTS user_notifications__user_id`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS user_notifications`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS user_notification_type`, [])
            })
        }
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`DROP INDEX IF EXISTS user_notifications__user_id`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS user_notifications`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS user_notification_type`, [])
        } catch (error) {
            await this.handleError(error)
        }
    }

    /**
     * Execute the migration.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> { }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { }
}
