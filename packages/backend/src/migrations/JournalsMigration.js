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
            
            // ========= Journals =============================================
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
                CREATE INDEX journals__name_index ON journals (name)
            `, [])

            await this.database.query(`
                CREATE INDEX journals_name_trgm_index ON journals USING GIN (name gin_trgm_ops)
            `, []) 

            
            // ========= Journal Members ======================================
            await this.database.query(`
                CREATE TYPE journal_member_permissions AS ENUM('owner', 'editor', 'reviewer')
            `, [])

             
            await this.database.query(`
                CREATE TABLE journal_members (
                    journal_id  bigint REFERENCES journals(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    permissions journal_member_permissions DEFAULT 'reviewer',
                    member_order int,
                    created_date    timestamptz,
                    updated_date    timestamptz,
                    PRIMARY KEY (journal_id, user_id)
                )
            `, [])

            // ========= Journal Submissions ==================================
            await this.database.query(`
                CREATE TYPE journal_submission_status AS ENUM('submitted', 'review', 'proofing', 'published', 'rejected', 'retracted')
            `, [])

            await this.database.query(`
                CREATE TABLE journal_submissions (
                    id bigserial PRIMARY KEY,
                    journal_id bigint REFERENCES journals(id) ON DELETE CASCADE,
                    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
                    submitter_id bigint REFERENCES users(id),
                    submission_comment text,
                    status journal_submission_status DEFAULT 'submitted',
                    decider_id bigint REFERENCES users(id),
                    decision_comment text,
                    decision_date timestamptz,
                    created_date timestamptz,
                    updated_date timestamptz
                )
            `, [])

            await this.database.query(`
                CREATE INDEX journal_submissions__journal_id_index ON journal_submissions ( journal_id )
            `, [])

            await this.database.query(`
                CREATE INDEX journal_submissions__paper_id_index ON journal_submissions ( paper_id )
            `, [])


            // ========= Journal Submission Reviewers =========================
            await this.database.query(`
                CREATE TABLE journal_submission_editors (
                    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz,
                    PRIMARY KEY (submission_id, user_id)
                )
            `, [])

            await this.database.query(`
                CREATE TABLE journal_submission_reviewers (
                    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz,
                    PRIMARY KEY (submission_id, user_id)
                )
            `, [])

            // ========= Papers ===============================================

            await this.database.query(`
                ALTER TABLE papers ADD COLUMN IF NOT EXISTS show_preprint boolean DEFAULT false
            `)

            await this.database.query(`
                ALTER TABLE paper_authors ADD COLUMN IF NOT EXISTS submitter boolean DEFAULT false
            `)

            // ========= Reviews ==============================================

            await this.database.query(`
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS submission_id bigint REFERENCES journal_submissions(id) DEFAULT NULL
            `, [])


        } catch (error) {
            try {
                await this.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS submission_id`)

                await this.database.query(`ALTER TABLE papers DROP COLUMN IF EXISTS show_preprint`)
                await this.database.query(`ALTER TABLE paper_authors DROP COLUMN IF EXISTS submitter`)

                await this.database.query(`DROP TABLE IF EXISTS journal_submission_reviewers`, [])
                await this.database.query(`DROP TABLE IF EXISTS journal_submission_editors`, [])

                await this.database.query(`DROP INDEX IF EXISTS journal_submissions__journal_id_index`, [])
                await this.database.query(`DROP INDEX IF EXISTS journal_submissions__paper_id_index`, [])
                await this.database.query(`DROP TABLE IF EXISTS journal_submissions`, [])
                await this.database.query(`DROP TYPE IF EXISTS journal_submission_status`, [])

                await this.database.query(`DROP TABLE IF EXISTS journal_members`, [])
                await this.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

                await this.database.query(`DROP INDEX IF EXISTS journals__name_index`, [])
                await this.database.query(`DROP INDEX IF EXISTS journals__name_trgm_index`, [])
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
            await this.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS submission_id`)

            await this.database.query(`ALTER TABLE papers DROP COLUMN IF EXISTS show_preprint`)
            await this.database.query(`ALTER TABLE paper_authors DROP COLUMN IF EXISTS submitter`)

            await this.database.query(`DROP TABLE IF EXISTS journal_submission_reviewers`, [])
            await this.database.query(`DROP TABLE IF EXISTS journal_submission_editors`, [])

            await this.database.query(`DROP INDEX IF EXISTS journal_submissions__journal_id_index`, [])
            await this.database.query(`DROP INDEX IF EXISTS journal_submissions__paper_id_index`, [])
            await this.database.query(`DROP TABLE IF EXISTS journal_submissions`, [])
            await this.database.query(`DROP TYPE IF EXISTS journal_submission_status`, [])

            await this.database.query(`DROP TABLE IF EXISTS journal_members`, [])
            await this.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

            await this.database.query(`DROP INDEX IF EXISTS journals__name_index`, [])
            await this.database.query(`DROP INDEX IF EXISTS journals__name_trgm_index`, [])
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
        try {
            await this.database.query(`UPDATE papers SET show_preprint = true`)

        } catch (error ) {
            throw new MigrationError('no-rollback', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 

    }
}
