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
import MigrationError from '../errors/MigrationError'

export default class Migration {
    core: Core

    constructor(core: Core) {
        this.core = core
    }

    /**
     * Handle errors in migrations.  Run an optional rollback function, or just
     * report the error appropriately.
     *
     * When there's an error we want to catch and it and potentially execute a
     * rollback.  Then we want to catch errors in the rollback and report
     * those.  
     *
     * @param {any} error   The error to report.  Ideally, would be an instance
     * of `Error`, but we can't guarantee that since we only know the type at
     * runtime.
     * @param {function} rollback   (Optional) An optional function to rollback
     * the migration.
     *
     * @throws {Error|MigrationError}   Throws a MigrationError if we're given
     * an `Error` object with a message.  Otherwise, throws an `Error`.
     *
     * @return {Promise<void>}
     */
    async handleError(error: any, rollback?: () => Promise<void>): Promise<void> {
        if ( rollback ) {
            try {
                await rollback()
            } catch (rollbackError) {
                this.core.logger.error(error)
                this.core.logger.error(rollbackError)
                if ( rollbackError instanceof Error ) {
                    throw new MigrationError('no-rollback', rollbackError.message)
                } else {
                    throw new Error("Thrown object is not an `Error`!")
                }
            }
            this.core.logger.error(error)
            if ( error instanceof Error) {
                throw new MigrationError('rolled-back', error.message)
            } else {
                throw new Error("Thrown object is not an `Error`!")
            }
        } else {
            this.core.logger.error(error)
            if ( error instanceof Error ) {
                throw new MigrationError('no-rollback', error.message)
            } else {
                throw new Error("Thrown object is not an `Error`!")
            }
        }
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
    async initialize(): Promise<void> {}

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {}

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(): Promise<void> {}

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> {}
}
