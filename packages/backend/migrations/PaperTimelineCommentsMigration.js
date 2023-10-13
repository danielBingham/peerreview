/********************************************************************
 *
 * PaperTimelineComments Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class PaperTimelineCommentsMigration {

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
                CREATE TYPE paper_comments_status AS ENUM('in-progress', 'committed', 'edit-in-progress');
            `, [])

            await this.database.query(`
                CREATE TABLE paper_comments (
                    id          bigserial PRIMARY KEY,
                    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
                    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
                    status      paper_comments_status,
                    content     text,
                    created_date    timestamptz,
                    updated_date    timestamptz,
                    committed_date  timestamptz DEFAULT NULL
                );
            `, [])


            await this.database.query(`
                CREATE INDEX paper_comments__paper_id ON paper_comments (paper_id);
            `, [])

            await this.database.query(`
                CREATE INDEX paper_comments__user_id ON paper_comments (user_id);
            `, [])
            
            await this.database.query(`
                CREATE TABLE paper_comment_versions (
                    paper_comment_id    bigint REFERENCES paper_comments(id) ON DELETE CASCADE,
                    version             int DEFAULT 1,
                    content             text,
                    created_date        timestamptz,
                    updated_date        timestamptz
                );
            `, [])
            
            await this.database.query(`
                CREATE INDEX paper_comment_versions__paper_comment_id ON paper_comment_versions (paper_comment_id);
            `, [])

            await this.database.query(`
                CREATE INDEX paper_comment_versions__version ON paper_comment_versions (version);
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events ADD COLUMN paper_comment_id bigint
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events ADD FOREIGN KEY (paper_comment_id) REFERENCES paper_comments(id)
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events ALTER COLUMN paper_comment_id SET DEFAULT NULL
            `, [])

            await this.database.query(`
                ALTER TYPE paper_event_types ADD VALUE IF NOT EXISTS 'paper:new-comment'
            `, [])

        } catch (error) {
            try {
                await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_comment_id`, [])

                await this.database.query(`DROP INDEX IF EXISTS paper_comment_versions__paper_comment_id`, [])
                await this.database.query(`DROP INDEX IF EXISTS paper_comment_verions__version`, [])
                await this.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])

                await this.database.query(`DROP INDEX IF EXISTS paper_comments__paper_id`, [])
                await this.database.query(`DROP INDEX IF EXISTS paper_comments__user_id`, [])
                await this.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
                await this.database.query(`DROP TYPE IF EXISTS paper_comment_status `, [])
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
            await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_comment_id`, [])

            await this.database.query(`DROP INDEX IF EXISTS paper_comment_versions__paper_comment_id`, [])
            await this.database.query(`DROP INDEX IF EXISTS paper_comment_verions__version`, [])
            await this.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])

            await this.database.query(`DROP INDEX IF EXISTS paper_comments__paper_id`, [])
            await this.database.query(`DROP INDEX IF EXISTS paper_comments__user_id`, [])
            await this.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
            await this.database.query(`DROP TYPE IF EXISTS paper_comment_status `, [])
        } catch (error) {
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
            await this.database.query(`
                UPDATE paper_events SET paper_comment_id = NULL 
            `, [])

        } catch (error ) {
            try {
            } catch (rollbackError) {
                throw new MigrationError('no-rollback', error.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        try {

        } catch(error) {
            throw MigrationError('no-rollback', error.message)
        }
    }
}
