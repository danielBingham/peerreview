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
import Core from '../core'
import Migration from './Migration'

/**
 * Add tables to support journal models.
 */
export default class JournalTransparencyModelsMigration extends Migration {
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
CREATE TYPE journal_model as ENUM('public', 'open-public', 'open-closed', 'closed')
            `, [])

            await this.core.database.query(`
ALTER TABLE journals ADD COLUMN model journal_model
            `, [])

        } catch (error) {
            await this.handleError(error, async () => {
                await this.core.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS model`, [])
                await this.core.database.query(`DROP TYPE IF EXISTS journal_model`, [])
            })
        }
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            await this.core.database.query(`ALTER TABLE journals DROP COLUMN IF EXISTS model`, [])
            await this.core.database.query(`DROP TYPE IF EXISTS journal_model`, [])
        } catch (error) {
            await this.handleError(error)
        }
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> { 
        try {
            await this.core.database.query(`
UPDATE journals SET model = 'public'
            `, [])

            await this.core.database.query(`
ALTER TABLE journals ALTER COLUMN model SET DEFAULT 'closed'
            `, [])

            await this.core.database.query(`
ALTER TABLE journals ALTER COLUMN model SET NOT NULL
            `, [])

        } catch (error ) {
            await this.handleError(error, async () => {
                await this.core.database.query(`
ALTER TABLE journals ALTER COLUMN model DROP NOT NULL
                `, [])

                await this.core.database.query(`
ALTER TABLE journals ALTER COLUMN model DROP DEFAULT
                `, [])

                await this.core.database.query(`
UPDATE journals SET model = null
                `, [])
            })
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { }
}
