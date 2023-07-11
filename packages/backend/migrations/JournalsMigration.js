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
            const createJournalsTableSql = `
                CREATE TABLE journals (
                    id      bigserial PRIMARY KEY,
                    name    varchar(1024) NOT NULL,
                    description text,
                    created_date    timestamptz,
                    updated_date    timestamptz
                )
            `
            const createJournalsTableResult = await this.database.query(createJournalsTableSql, [])

            const createJournalUsersPermissionsTypeSql = `
                CREATE TYPE journal_users_permissions AS ENUM('owner', 'editor', 'reviewer')
            `
            const createJournalUsersPermissionsTypeResult = await this.database.query(createJournalUsersPermissionsTypeSql, [])

            const createJournalUsersTableSql = `
                CREATE TABLE journal_users (
                    journal_id  bigint REFERENCES journals(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    permissions journal_users_permissions DEFAULT 'reviewer',
                    created_date    timestamptz,
                    updated_date    timestamptz
                )
            `
            const createJournalUsersTableResult = await this.database.query(createJournalUsersTableSql, [])


        } catch (error) {
            try {
                const dropJournalsTableSql = `DROP TABLE IF EXISTS journals`
                const dropJournalsTableResult = await this.database.query(dropJournalsTableSql, [])

                const dropJournalUsersPermissionsTypeSql = `DROP TYPE IF EXISTS journal_users_permissions`
                const dropJournalUsersPermissionsTypeResult = await this.database.query(dropJournalUsersPermissionsTypeSql, [])

                const dropJournalUsersTableSql = `DROP TABLE IF EXISTS journal_users`
                const dropJournalUsersTableResult = await this.database.query(dropJournalUsersTableSql, [])

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
            const dropJournalsTableSql = `DROP TABLE IF EXISTS journals`
            const dropJournalsTableResult = await this.database.query(dropJournalsTableSql, [])

            const dropJournalUsersPermissionsTypeSql = `DROP TYPE IF EXISTS journal_users_permissions`
            const dropJournalUsersPermissionsTypeResult = await this.database.query(dropJournalUsersPermissionsTypeSql, [])

            const dropJournalUsersTableSql = `DROP TABLE IF EXISTS journal_users`
            const dropJournalUsersTableResult = await this.database.query(dropJournalUsersTableSql, [])
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
