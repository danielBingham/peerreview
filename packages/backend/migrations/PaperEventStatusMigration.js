/********************************************************************
 *
 * PaperEventStatus Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class PaperEventStatusMigration {

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
                CREATE TYPE paper_event_status AS ENUM(
                    'in-progress',
                    'committed'
                )
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events ADD COLUMN IF NOT EXISTS status paper_event_status
            `, [])


            await this.database.query(`
                ALTER TABLE paper_events ALTER COLUMN status SET DEFAULT 'committed' 
            `, [])

            await this.database.query(`
                ALTER TABLE paper_events
                    DROP CONSTRAINT paper_events_review_id_fkey,
                    ADD FOREIGN KEY (review_id)
                        REFERENCES reviews(id)
                            ON DELETE CASCADE
            `, [])

        } catch (error) {
            try {
                await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS status`, [])
                await this.database.query(`DROP TYPE IF EXISTS paper_event_status`, [])
                await this.database.query(`
                    ALTER TABLE paper_events
                        DROP CONSTRAINT paper_events_review_id_fkey,
                        ADD FOREIGN KEY (review_id)
                            REFERENCES reviews(id)
                `, [])
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
            await this.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS status`, [])
            await this.database.query(`DROP TYPE IF EXISTS paper_event_status`, [])
            await this.database.query(`
                    ALTER TABLE paper_events
                        DROP CONSTRAINT paper_events_review_id_fkey,
                        ADD FOREIGN KEY (review_id)
                            REFERENCES reviews(id)
            `, [])
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
                UPDATE paper_events SET status = 'committed'
            `, [])

        } catch (error ) {
            try {
                await this.database.query(`UPDATE paper_events SET status = NULL`, [])
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
