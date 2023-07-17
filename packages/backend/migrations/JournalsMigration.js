/********************************************************************
 *
 * Journals Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class JournalsMigration {

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
                CREATE TABLE journals (
                    id      bigserial PRIMARY KEY,
                    name    varchar(1024) NOT NULL,
                    description text,
                    created_date    timestamptz,
                    updated_date    timestamptz
                )
            `, [])

             
            await this.database.query(`
                CREATE TYPE journal_member_permissions AS ENUM('owner', 'editor', 'reviewer')
            `, [])

             
            await this.database.query(`
                CREATE TABLE journal_members (
                    journal_id  bigint REFERENCES journals(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    permissions journal_member_permissions DEFAULT 'reviewer',
                    created_date    timestamptz,
                    updated_date    timestamptz
                )
            `, [])

            await this.database.query(`
                CREATE TABLE journal_submission (
                    id bigserial PRIMARY KEY,
                    journal_id bigint REFERENCES journals(id) ON DELETE CASCADE,
                    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz

                )
            `, [])

            await this.database.query(`
                CREATE TABLE journal_submission_users (
                    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users (id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz
                )
            `, [])


        } catch (error) {
            try {
                await this.database.query(`DROP TABLE IF EXISTS journal_submission_users`, [])

                await this.database.query(`DROP TABLE IF EXISTS journal_submission`, [])

                await this.database.query(`DROP TABLE IF EXISTS journal_members`, [])

                await this.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

                await this.database.query(`DROP TABLE IF EXISTS journals`, [])



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
                await this.database.query(`DROP TABLE IF EXISTS journal_submission_users`, [])

                await this.database.query(`DROP TABLE IF EXISTS journal_submission`, [])

                await this.database.query(`DROP TABLE IF EXISTS journal_members`, [])

                await this.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

                await this.database.query(`DROP TABLE IF EXISTS journals`, [])
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

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 

    }
}
