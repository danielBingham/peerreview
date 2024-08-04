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
import { Core } from '@danielbingham/peerreview-core'

export class FieldLibrary {
    core: Core

    constructor(core: Core) {
      this.core = core
    }

    /**
     * Select the immediate children of parent field identified by `parentId`
     *
     * @param {number} parentId    The id of the field who's children we want to
     * select.
     *
     * @return {Promise<number[]>}  An array of `Field.id` numbers
     * corresponding to the immediate children of the field identified by
     * `parentId`.
     */
    async selectFieldChildren(parentId: number): Promise<number[]> {
        const results = await this.core.database.query(`
            SELECT child_id FROM field_relationships WHERE parent_id = $1
         `, [ parentId ])

        if ( results.rows.length <= 0) {
            return []
        }

        return results.rows.map((r) => r.child_id)
    }

    /**
     * Select the immediate parents of the field identified by `childId`
     *
     * @param {number} childId The id of the field who's parents we want to
     * select.
     *
     * @return {Promise<number[]>}  A promise which resolves to an array of
     * `Field.id` numbers that represent the immediate parents of `childId`.
     */
    async selectFieldParents(childId: number): Promise<number[]> {
        const results = await this.core.database.query(`
            SELECT parent_id FROM field_relationships WHERE child_id = $1
        `, [ childId ])

        if ( results.rows.length <= 0) {
            return []
        }

        return results.rows.map((r) => r.parent_id)
    }


    /**
     * Select the entire tree under a single field.
     *
     * @param {number[]} rootIds An array of field ids who's descendents we want
     * to select. 
     *
     * @return {Promise<number[]>}  A promise which resolves to an array of
     * `Field.id` containing the ids of all of the decendends of the given
     * fields.
     **/
    async selectFieldDescendents(rootIds: number[]): Promise<number[]> {
        const fieldIds = [ ...rootIds]
        let previous = [ ...rootIds]
        do {
            const results = await this.core.database.query(`SELECT child_id as id FROM field_relationships WHERE field_relationships.parent_id = ANY ($1::int[])`, [ previous ])

            // We've reached the bottom of the tree.
            if ( results.rows.length == 0) {
               return fieldIds 
            }

            previous = []
            for ( const row of results.rows ) {
                fieldIds.push(row.id)
                previous.push(row.id)
            }
        } while(previous.length > 0)

        return fieldIds
    }

    /**
     * Select the entire tree above an array of fields.  Results include the
     * root fields.
     *
     * @param {number[]} rootIds An array of field ids the children of which we
     * want to select.
     *
     * @return {Promise<number[]>}  A promise that resolves with an array of
     * field ids representing all of the ancestors of these fields.
     */
    async selectFieldAncestors(rootIds: number[]): Promise<number[]> {
        const fieldIds = [ ...rootIds]
        let previous = [ ...rootIds]
        do {
            const results = await this.core.database.query(`SELECT parent_id as id FROM field_relationships WHERE field_relationships.child_id = ANY ($1::int[])`, [ previous ])

            // We've reached the top of the tree.
            if ( results.rows.length == 0) {
               return fieldIds 
            }

            previous = []
            for ( const row of results.rows ) {
                fieldIds.push(row.id)
                previous.push(row.id)
            }
        } while(previous.length > 0)

        return fieldIds
    }

}
