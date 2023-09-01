/********************************************************************
 *
 * PaperComments Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class PaperCommentsMigration {

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
CREATE TYPE paper_comment_status as ENUM('in-progress', 'posted', 'edit-in-progress', 'reverted')
            `, []) 

            
            await this.database.query(`
CREATE TABLE paper_comments (
    id  bigserial PRIMARY KEY,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id),
    content text,
    status paper_comment_status,
    created_date timestamptz,
    updated_date timestamptz
)
            `, [])

             
            await this.database.query(`
CREATE TABLE paper_comment_versions (
    comment_id bigint REFERENCES paper_comments(id) ON DELETE CASCADE,
    version int DEFAULT 0,
    content text,
    created_date timestamptz,
    updated_date timestamptz,
    PRIMARY KEY( comment_id, version)
)
            `, [])


        } catch (error) {
            try {
                await this.database.query(`DROP TYPE IF EXISTS paper_comment_status`, [])
                await this.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
                await this.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])

            } catch (rollbackError) {
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {

        try {
            await this.database.query(`DROP TYPE IF EXISTS paper_comment_status`, [])
            await this.database.query(`DROP TABLE IF EXISTS paper_comments`, [])
            await this.database.query(`DROP TABLE IF EXISTS paper_comment_versions`, [])
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

        } catch (error ) {
            throw new MigrationError('no-rollback', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 

    }
}
