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
 * Add support for anonymity features.
 */
export default class AnonymityMigration extends Migration {
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
                ALTER TABLE paper_events ADD COLUMN IF NOT EXISTS anonymous boolean
            `, [])

            await this.core.database.query(`
                UPDATE paper_events SET anonymous=false
            `, [])

            await this.core.database.query(`
                ALTER TABLE paper_events ALTER COLUMN anonymous SET DEFAULT false
            `, [])



            await this.core.database.query(`
CREATE TYPE journal_anonymity as ENUM('forced-identified', 'default-identified', 'reviewers-anonymous', 'double-anonymous')
            `, [])

            await this.core.database.query(`
                ALTER TABLE journals ADD COLUMN IF NOT EXISTS anonymity journal_anonymity
            `, [])

            await this.core.database.query(`
                UPDATE journals SET anonymity='default-identified'
            `, [])

            await this.core.database.query(`
                ALTER TABLE journals ALTER COLUMN anonymity SET DEFAULT 'double-anonymous'
            `, [])

            await this.core.database.query(`
                ALTER TABLE journals ALTER COLUMN anonymity SET NOT NULL
            `, [])

        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS anonymous`, [])
                await this.core.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS anonymity`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS journal_anonymity`, [])
            })
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`ALTER TABLE paper_events DROP COLUMN IF EXISTS anonymous`, [])
            await this.core.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS anonymity`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS journal_anonymity`, [])
        } catch (error) {
            await this.handleError(error)
        }
    }

    /**
     * Execute the migration.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> { }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { }
}
