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
/********************************************************************
 * Comment Version Migration
 *
 * Adds the comment versioning table.
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class PreprintSubmissionTiedToPaperVersion {

    constructor(core) {
        this.core = core

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

            await this.core.database.query(`ALTER TABLE paper_versions ADD COLUMN is_preprint boolean NOT NULL DEFAULT false`, [])
            await this.core.database.query(`ALTER TABLE paper_versions ADD COLUMN is_submitted boolean NOT NULL DEFAULT false`, [])
            await this.core.database.query(`ALTER TABLE paper_versions ALTER COLUMN is_published SET NOT NULL`, [])

            // ============== Give paper_versions a uuid primary key
            await this.core.database.query(`ALTER TABLE paper_versions DROP CONSTRAINT IF EXISTS PRIMARY KEY`, [])
            await this.core.database.query(`ALTER TABLE paper_versions ADD COLUMN id uuid PRIMARY KEY DEFAULT get_random_uuid()`, [])

            // ============== Add paper_version_id to `reviews` table 
            await this.core.database.query(`ALTER TABLE reviews ADD COLUMN paper_version_id uuid REFERENCES paper_versions(id) ON DELETE CASCADE`, [])
            await this.core.database.query(`CREATE INDEX reviews__paper_version_id ON reviews (paper_version_id)`, [])

            // ============= Add paper_version_id to `paper_events` table 
            await this.core.database.query(`ALTER TABLE paper_events ADD COLUMN paper_version_id uuid REFERENCES paper_versions(id) ON DELETE CASCADE`, [])
            await this.core.database.query(`CREATE INDEX paper_events__paper_version_id ON paper_events (paper_version_id)`, [])

            // ============= Add paper_version_id to `paper_comments` table
            await this.core.database.query(`ALTER TABLE paper_comments ADD COLUMN paper_version_id uuid REFERENCES paper_versions(id) ON DELETE CASCADE`, [])
            await this.core.database.query(`CREATE INDEX paper_comments__paper_version_id ON paper_comments (paper_version_id)`, [])

        } catch (error) {
            try {
                await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__paper_version_id`, [])
                await this.core.database.query(`ALTER TABLE paper_comments DROP COLUMN IF EXISTS paper_version_id`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS paper_events__paper_version_id`, [])
                await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_version_id`, [])

                await this.core.database.query(`DROP INDEX IF EXISTS reviews__paper_version_id`, [])
                await this.core.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS paper_version_id`, [])

                await this.core.database.query(`ALTER TABLE paper_versions DROP CONSTRAINT IF EXISTS PRIMARY KEY`, [])
                await this.core.database.query(`ALTER TABLE paper_versions ADD CONSTRAINT PRIMARY KEY(paper_id, version)`, [])

                await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS id`, [])

                await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS is_preprint`, [])
                await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS is_submitted`, [])
                await this.core.database.query(`ALTER TABLE paper_versions ALTER COLUMN is_published DROP NOT NULL`, [])

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
            await this.core.database.query(`DROP INDEX IF EXISTS paper_comments__paper_version_id`, [])
            await this.core.database.query(`ALTER TABLE paper_comments DROP COLUMN IF EXISTS paper_version_id`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS paper_events__paper_version_id`, [])
            await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS paper_version_id`, [])

            await this.core.database.query(`DROP INDEX IF EXISTS reviews__paper_version_id`, [])
            await this.core.database.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS paper_version_id`, [])

            await this.core.database.query(`ALTER TABLE paper_versions DROP CONSTRAINT IF EXISTS PRIMARY KEY`, [])
            await this.core.database.query(`ALTER TABLE paper_versions ADD CONSTRAINT PRIMARY KEY(paper_id, version)`, [])

            await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS id`, [])

            await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS is_preprint`, [])
            await this.core.database.query(`ALTER TABLE paper_versions DROP COLUMN IF EXISTS is_submitted`, [])
            await this.core.database.query(`ALTER TABLE paper_versions ALTER COLUMN is_published DROP NOT NULL`, [])

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
            const preprintResults = await this.core.database.query(`SELECT id FROM papers WHERE show_preprint = TRUE`)
            const preprintIds = preprintResults.rows.map((r) => r.id)

            const submissionResults = await this.core.database.query(`SELECT paper_id FROM journal_submissions`)
            const submissionIds = submissionResults.rows.map((r) => r.paper_id)

            await this.core.database.query(`UPDATE paper_versions SET is_preprint = true WHERE paper_id = ANY($1::bigint[])`, [ preprintIds ])
            await this.core.database.query(`UPDATE paper_versions SET is_submitted = true WHERE paper_id = ANY($1::bigint[])`, [ submissionIds ])

            await this.core.database.query(`UPDATE paper_comments SET paper_version_id = paper_versions.id FROM paper_versions WHERE paper_comments.paper_version = paper_versions.version`, [])
            await this.core.database.query(`UPDATE paper_events SET paper_version_id = paper_versions.id FROM paper_versions WHERE paper_versions.version = paper_events.version`, [])
            await this.core.database.query(`UPDATE reviews SET paper_version_id = paper_versions.id FROM paper_versions WHERE paper_versions.version = reviews.version`, [])

        } catch (error) {
            try {
                await this.core.database.query(`UPDATE paper_versions SET is_preprint = false`, [])
                await this.core.database.query(`UPDATE paper_versions SET is_submitted = false`, [])
            } catch (rollbackError) {
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        try {
            await this.core.database.query(`UPDATE paper_versions SET is_preprint = false`, [])
            await this.core.database.query(`UPDATE paper_versions SET is_submitted = false`, [])
        } catch (error) {
            throw new MigrationError('no-rollback', error.message)
        }
    }
}
