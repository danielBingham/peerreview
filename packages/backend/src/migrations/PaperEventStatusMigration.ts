/********************************************************************
 *
 * PaperEventStatus Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/
import Core from '../core'
import Migration from './Migration'

export default  class PaperEventStatusMigration extends Migration {
    constructor(core: Core) {
        super(core)
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
    async initialize(): Promise<void> {
        try {
            await this.core.database.query(`
                CREATE TYPE paper_event_status AS ENUM(
                    'in-progress',
                    'committed'
                )
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events ADD COLUMN IF NOT EXISTS status paper_event_status
            `, [])


            await this.core.database.query(`
                ALTER TABLE paper_events ALTER COLUMN status SET DEFAULT 'committed' 
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events
                    DROP CONSTRAINT paper_events_review_id_fkey,
                    ADD FOREIGN KEY (review_id)
                        REFERENCES reviews(id)
                            ON DELETE CASCADE
            `, [])

        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS status`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS paper_event_status`, [])
                await this.core.database.query(`
                    ALTER TABLE paper_events
                        DROP CONSTRAINT paper_events_review_id_fkey,
                        ADD FOREIGN KEY (review_id)
                            REFERENCES reviews(id)
                `, [])
            })
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS status`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS paper_event_status`, [])
            await this.core.database.query(`
                    ALTER TABLE paper_events
                        DROP CONSTRAINT paper_events_review_id_fkey,
                        ADD FOREIGN KEY (review_id)
                            REFERENCES reviews(id)
            `, [])
        } catch (error) {
            await this.handleError(error)
        }
    }

    /**
     * Execute the migration.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> { 
        try {
            await this.core.database.query(`
                UPDATE paper_events SET status = 'committed'
            `, [])

        } catch (error ) {
            await this.handleError(error, async () => {
                await this.core.database.query(`UPDATE paper_events SET status = NULL`, [])
            })
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { }
}
