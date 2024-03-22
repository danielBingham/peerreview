/********************************************************************
 *
 * Anonymity Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class AnonymityMigration {

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
                ALTER TABLE paper_events ADD COLUMN IF NOT EXISTS anonymous boolean
            `, [])

            await this.database.query(`
                UPDATE paper_events SET anonymous=false
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events ALTER COLUMN anonymous SET DEFAULT false
            `, [])



            await this.database.query(`
CREATE TYPE journal_anonymity as ENUM('forced-identified', 'default-identified', 'reviewers-anonymous', 'double-anonymous')
            `, [])

            await this.database.query(`
                ALTER TABLE journals ADD COLUMN IF NOT EXISTS anonymity journal_anonymity
            `, [])

            await this.database.query(`
                UPDATE journals SET anonymity='default-identified'
            `, [])

            await this.database.query(`
                ALTER TABLE journals ALTER COLUMN anonymity SET DEFAULT 'double-anonymous'
            `, [])

            await this.database.querY(`
                ALTER TABLE journals ALTER COLUMN anonymity SET NOT NULL
            `, [])

        } catch (error) {
            try {
                await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS anonymous`, [])
                await this.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS anonymity`, [])
                await this.database.query(`DROP TYPE IF EXISTS journal_anonymity`, [])

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
            await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS anonymous`, [])
            await this.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS anonymity`, [])
            await this.database.query(`DROP TYPE IF EXISTS journal_anonymity`, [])
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
            throw new MigrationError('no-rollback', error.message)
        }
    }
}
