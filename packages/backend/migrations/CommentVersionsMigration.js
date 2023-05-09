/********************************************************************
 * Comment Version Migration
 *
 * Adds the comment versioning table.
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class CommentVersionsMigration {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config
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
        const sql = `
CREATE TABLE review_comment_versions (
    comment_id      bigint REFERENCES review_comments(id) ON DELETE CASCADE,
    version         int NOT NULL DEFAULT 1,
    content         text,
    created_date    timestamptz,
    updated_date    timestamptz
)
        `

        try {
            const result = await this.database.query(sql, [])
        } catch (error) {
            const rollbackSql = `DROP TABLE IF EXISTS review_comment_versions`
            try {
                const rollbackResult = await this.database.query(rollbackSql, [])
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
        const sql = `
            DROP TABLE review_comment_versions
        `

        await this.database.query(sql, [])
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { 
        const sql = `
            INSERT INTO review_comment_versions (comment_id, content, created_date, updated_date)
                SELECT id, content, now(), now() FROM review_comments
        `

        await this.database.query(sql, [])

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        const sql = `
            DELETE FROM review_comment_versions
        `

        await this.database.query(sql, [])
    }
}
