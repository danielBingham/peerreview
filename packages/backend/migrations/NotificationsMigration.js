/********************************************************************
 *
 * Notifications Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class NotificationsMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
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
    async initialize() {
        try {
            await this.database.query(`
CREATE TYPE user_notification_type AS ENUM(

    /* User was added to a paper as an author. */
    'author:paper-submitted', 
    
    /* 
     * A new version was uploaded for a paper the user is an author, editor, or
     * reviewer on. 
     */
    'author:new-version', 
    'reviewer:new-version',
    'editor:new-version',

    /**
     * A paper the user is an author of was submitted as a preprint.
     */
    'author:preprint-posted',

    /**
     * A review was posted to a paper that the user is an author or editor of.
     */
    'author:new-review',
    'editor:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    'author:review-comment-reply',
    'reviewer:review-comment-reply',
    'editor:review-comemnt-reply',

    /**
     * A comment was posted to the timeline of a paper the user is an author,
     * reviewer, or editor for. TODO
     */
    'author:new-comment',
    'reviewer:new-comment',
    'editor:new-comment',
    
    /**
     * User has been added to a journal's team.
     */
    'journal-member:invited',

    /**
     * Role in journal changed. TODO
     */
    'journal-member:role-changed',

    /**
     * User removed from journal's team. TODO
     */
    'journal-member:removed',

    /**
     * A paper the user is an author of was submitted to a journal.
     * A journal the user is a managing editor of received a new submission.
     */
    'author:new-submission', 
    'editor:new-submission',

    /**
     * The status of a submission the user is an author of changed.
     */
    'author:submission-status-changed',

    /**
     * A user was (un)assigned as a reviewer to a paper. 
     */
    'reviewer:submission-assigned',
    'reviewer:submission-unassigned',

    /**
     * A user was (un)assigned as an editor to a paper.
     */
    'editor:submission-assigned',
    'editor:submission-unassigned'
);
            `, [])

            await this.database.query(`
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

            await this.database.query(`
CREATE INDEX user_notifications__user_id ON user_notifications (user_id)
            `, [])
        
        } catch (error) {
            try {
                await this.database.query(`DROP INDEX IF EXISTS user_notifications__user_id`, [])
                await this.database.query(`DROP TABLE IF EXISTS user_notifications`, [])
            } catch (rollbackError) {
                console.error(error)
                console.error(rollbackError)
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            console.error(error)
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {
        try {
            await this.database.query(`DROP INDEX IF EXISTS user_notifications__user_id`, [])
            await this.database.query(`DROP TABLE IF EXISTS user_notifications`, [])
        } catch (error) {
            console.error(error)
            throw new MigrationError('no-rollback', error.message)
        }
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { 
        try {

        } catch (error ) {
            try {

            } catch (rollbackError) {
                console.error(error)
                console.error(rollbackError)
                throw new MigrationError('no-rollback', error.message)
            }
            console.error(error)
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        try {

        } catch(error) {
            console.error(error)
            throw MigrationError('no-rollback', error.message)
        }
    }
}