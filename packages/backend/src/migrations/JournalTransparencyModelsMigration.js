/********************************************************************
 *
 * Journal Transparency Models Migration
 *
 * Add the tables to support journal models.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class JournalTransparencyModelsMigration {

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
CREATE TYPE journal_model as ENUM('public', 'open-public', 'open-closed', 'closed')
            `, [])

            await this.database.query(`
ALTER TABLE journals ADD COLUMN model journal_model
            `, [])


        } catch (error) {
            try {
                await this.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS model`, [])
                await this.database.query(`DROP TYPE IF EXISTS journal_model`, [])
            } catch (rollbackError) {
                console.error(error)
                console.error(rollebackError)
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
            await this.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS model`, [])
            await this.database.query(`DROP TYPE IF EXISTS journal_model`, [])
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
UPDATE journals SET model = 'public'
            `, [])

            await this.database.query(`
ALTER TABLE journals ALTER COLUMN model SET DEFAULT 'closed'
            `, [])

            await this.database.query(`
ALTER TABLE journals ALTER COLUMN model SET NOT NULL
            `, [])

        } catch (error ) {
            try {
                await this.database.query(`
ALTER TABLE journals ALTER COLUMN model DROP NOT NULL
                `, [])

                await this.database.query(`
ALTER TABLE journals ALTER COLUMN model DROP DEFAULT
                `, [])

                await this.database.query(`
UPDATE journals SET model = null
                `, [])
            } catch (rollbackError) {
                console.error(error)
                console.error(rollebackError)
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            console.error(error)
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 

    }
}
