/********************************************************************
 * WIPNotice Migration 
 *
 * Database migration to add the wip_dismissed setting to the user_settings
 * table.
 *
 ********************************************************************/

module.exports = class WIPNoticeMigration {

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
            ALTER TABLE user_settings ADD COLUMN wip_dismissed boolean DEFAULT false 
        `

        const result = await this.database.query(sql, [])
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {
        const sql = `
            ALTER TABLE user_settings DROP COLUMN wip_dismissed 
        `

        await this.database.query(sql, [])
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { }
}
