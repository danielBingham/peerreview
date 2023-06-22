/********************************************************************
 * Comment Version Migration
 *
 * Adds the comment versioning table.
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class CommentVersionsMigration {

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
            const createTableSql = `
CREATE TABLE review_comment_versions (
    comment_id      bigint REFERENCES review_comments(id) ON DELETE CASCADE,
    version         int NOT NULL DEFAULT 1,
    content         text,
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY(comment_id, version)
)
            `
            const createTableResult = await this.database.query(createTableSql, [])

            const alterTableSql = `
                ALTER TABLE review_comments ADD COLUMN version int NOT NULL DEFAULT 0
            `
            const alterTableResult = await this.database.query(alterTableSql, [])

            // TECH DEBT - this isn't going to be rolled back.  The only way to
            // remove a value from an enum is to drop the whole type which
            // seems unnecessarily costly.  
            //
            // In this case, better to just ignore the value.
            const alterTypeEditInProgressSql = `
                ALTER TYPE review_comment_status ADD VALUE IF NOT EXISTS 'edit-in-progress'
            `
            const alterTypeEditInProgressResult = await this.database.query(alterTypeEditInProgressSql, [])
            
            // TECH DEBT - won't be removed, see comment above.
            const alterTypeRevertSql = `
                ALTER TYPE review_comment_status ADD VALUE IF NOT EXISTS 'reverted'
            `
            const alterTypeRevertResult = await this.database.query(alterTypeRevertSql, [])
        } catch (error) {
            try {
                const dropTableSql = `DROP TABLE IF EXISTS review_comment_versions`
                const dropTableResult = await this.database.query(dropTableSql, [])

                const dropColumnSql = `ALTER TABLE review_comments DROP COLUMN IF EXISTS version`
                const dropColumnResult = await this.database.query(dropColumnSql, [])
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
            const dropTableSql = `
                DROP TABLE review_comment_versions
            `
            await this.database.query(dropTableSql, [])

            const alterTableSql = `ALTER TABLE review_comments DROP COLUMN IF EXISTS version`
            const alterTableResult = await this.database.query(alterTableSql, []) 
        } catch (error) {
            throw new MigrationError('rolled-back', error.message)
        }
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

        try {
            await this.database.query(sql, [])
        } catch (error) {
            try {
               await this.database.query('DELETE FROM review_comment_versions', [])
            } catch (rollbackError) {
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        const sql = `
            DELETE FROM review_comment_versions
        `

        try {
            await this.database.query(sql, [])
        } catch (error) {
            throw new MigrationError('rolled-back', error.message)
        }
    }
}
