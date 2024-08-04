/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Core } from '@journalhub/core'
import Migration from './Migration'

/**
 * Add the tables to support journals.
 */
export default class JournalsMigration extends Migration {
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
            
            // ========= Journals =============================================
            await this.core.database.query(`
                CREATE TABLE journals (
                    id      bigserial PRIMARY KEY,
                    name    varchar(1024) NOT NULL,
                    description text,
                    created_date    timestamptz,
                    updated_date    timestamptz
                )
            `, [])

            await this.core.database.query(`
                CREATE INDEX journals__name_index ON journals (name)
            `, [])

            await this.core.database.query(`
                CREATE INDEX journals_name_trgm_index ON journals USING GIN (name gin_trgm_ops)
            `, []) 

            
            // ========= Journal Members ======================================
            await this.core.database.query(`
                CREATE TYPE journal_member_permissions AS ENUM('owner', 'editor', 'reviewer')
            `, [])

             
            await this.core.database.query(`
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
            await this.core.database.query(`
                CREATE TYPE journal_submission_status AS ENUM('submitted', 'review', 'proofing', 'published', 'rejected', 'retracted')
            `, [])

            await this.core.database.query(`
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

            await this.core.database.query(`
                CREATE INDEX journal_submissions__journal_id_index ON journal_submissions ( journal_id )
            `, [])

            await this.core.database.query(`
                CREATE INDEX journal_submissions__paper_id_index ON journal_submissions ( paper_id )
            `, [])


            // ========= Journal Submission Reviewers =========================
            await this.core.database.query(`
                CREATE TABLE journal_submission_editors (
                    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz,
                    PRIMARY KEY (submission_id, user_id)
                )
            `, [])

            await this.core.database.query(`
                CREATE TABLE journal_submission_reviewers (
                    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
                    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
                    created_date timestamptz,
                    updated_date timestamptz,
                    PRIMARY KEY (submission_id, user_id)
                )
            `, [])

            // ========= Papers ===============================================

            await this.core.database.query(`
                ALTER TABLE papers ADD COLUMN IF NOT EXISTS show_preprint boolean DEFAULT false
            `)

            await this.core.database.query(`
                ALTER TABLE paper_authors ADD COLUMN IF NOT EXISTS submitter boolean DEFAULT false
            `)

            // ========= Reviews ==============================================

            await this.core.database.query(`
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS submission_id bigint REFERENCES journal_submissions(id) DEFAULT NULL
            `, [])


        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS submission_id`)

                await this.core.database.query(`ALTER TABLE papers DROP COLUMN IF EXISTS show_preprint`)
                await this.core.database.query(`ALTER TABLE paper_authors DROP COLUMN IF EXISTS submitter`)

                await this.core.database.query(`DROP TABLE IF EXISTS journal_submission_reviewers`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS journal_submission_editors`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS journal_submissions__journal_id_index`, [])
                await this.core.database.query(`DROP INDEX IF EXISTS journal_submissions__paper_id_index`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS journal_submissions`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS journal_submission_status`, [])

                await this.core.database.query(`DROP TABLE IF EXISTS journal_members`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS journals__name_index`, [])
                await this.core.database.query(`DROP INDEX IF EXISTS journals__name_trgm_index`, [])
                await this.core.database.query(`DROP TABLE IF EXISTS journals`, [])
            })
        }
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS submission_id`)

            await this.core.database.query(`ALTER TABLE papers DROP COLUMN IF EXISTS show_preprint`)
            await this.core.database.query(`ALTER TABLE paper_authors DROP COLUMN IF EXISTS submitter`)

            await this.core.database.query(`DROP TABLE IF EXISTS journal_submission_reviewers`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS journal_submission_editors`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS journal_submissions__journal_id_index`, [])
            await this.core.database.query(`DROP INDEX IF EXISTS journal_submissions__paper_id_index`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS journal_submissions`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS journal_submission_status`, [])

            await this.core.database.query(`DROP TABLE IF EXISTS journal_members`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS journal_member_permissions`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS journals__name_index`, [])
            await this.core.database.query(`DROP INDEX IF EXISTS journals__name_trgm_index`, [])
            await this.core.database.query(`DROP TABLE IF EXISTS journals`, [])
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
            await this.core.database.query(`UPDATE papers SET show_preprint = true`)
        } catch (error ) {
            await this.handleError(error)
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { }
}
