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

export default class CommentVersionsMigration extends Migration {
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
            const createTableSql = `
CREATE TABLE review_comment_versions (
    comment_id      bigint REFERENCES review_comments(id) ON DELETE CASCADE,
    version         int NOT NULL DEFAULT 1,
    content         text,
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY(comment_id, version)
)
            `
            await this.core.database.query(createTableSql, [])

            const alterTableSql = `
                ALTER TABLE review_comments ADD COLUMN version int NOT NULL DEFAULT 0
            `
            await this.core.database.query(alterTableSql, [])

            // TECH DEBT - this isn't going to be rolled back.  The only way to
            // remove a value from an enum is to drop the whole type which
            // seems unnecessarily costly.  
            //
            // In this case, better to just ignore the value.
            const alterTypeEditInProgressSql = `
                ALTER TYPE review_comment_status ADD VALUE IF NOT EXISTS 'edit-in-progress'
            `
            await this.core.database.query(alterTypeEditInProgressSql, [])
            
            // TECH DEBT - won't be removed, see comment above.
            const alterTypeRevertSql = `
                ALTER TYPE review_comment_status ADD VALUE IF NOT EXISTS 'reverted'
            `
            const alterTypeRevertResult = await this.core.database.query(alterTypeRevertSql, [])
        } catch (error) {
            await this.handleError(error, async () => {
                const dropTableSql = `DROP TABLE IF EXISTS review_comment_versions`
                await this.core.database.query(dropTableSql, [])

                const dropColumnSql = `ALTER TABLE review_comments DROP COLUMN IF EXISTS version`
                await this.core.database.query(dropColumnSql, [])
            })
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize(): Promise<void> {
        try {
            const dropTableSql = `
                DROP TABLE review_comment_versions
            `
            await this.core.database.query(dropTableSql, [])

            const alterTableSql = `ALTER TABLE review_comments DROP COLUMN IF EXISTS version`
            await this.core.database.query(alterTableSql, []) 
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

            // Add version rows for every comment.
            const insertVersionSQL= `
                INSERT INTO review_comment_versions (comment_id, content, created_date, updated_date)
                    SELECT id, content, now(), now() FROM review_comments
            `
            await this.core.database.query(insertVersionSQL, [])

            // Update the review_comment.version to verison 1.
            const updateCommentVersionSQL = `
                UPDATE review_comments set version = review_comment_versions.version
                    FROM (SELECT comment_id, version FROM review_comment_versions) as review_comment_versions
                    WHERE review_comments.id = review_comment_versions.comment_id
            `
            await this.core.database.query(updateCommentVersionSQL, [])

        } catch (error) {
            await this.handleError(error, async () => {
               await this.core.database.query('DELETE FROM review_comment_versions', [])
            })
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(): Promise<void> { 
        try {
            await this.core.database.query(`
                DELETE FROM review_comment_versions
            `, [])
        } catch (error) {
            await this.handleError(error)
        }
    }
}
