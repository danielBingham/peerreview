/********************************************************************
 * Example Migration
 *
 * This is purely here for example and documentation purposes.
 *
 ********************************************************************/

module.exports = class ExampleMigration {

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
            CREATE TABLE example (
                id  bigserial PRIMARY KEY
            )
        `

        const result = await this.database.query(sql, [])
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {
        const sql = `
            DROP TABLE example 
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
            ALTER TABLE example ADD COLUMN name varchar(256)
        `

        await this.database.query(sql, [])
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) {
        const sql = `
            ALTER TABLE example DROP COLUMN name
        `
        await this.database.query(sql, [])
    }
}
