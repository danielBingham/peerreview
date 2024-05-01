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

import { QueryResultRow } from 'pg'

import { Field, DatabaseResult, ModelDictionary, PageMetadata } from '@danielbingham/peerreview-model'

import { Core } from '@danielbingham/peerreview-core'

const PAGE_SIZE = 20 

/**
 * A Data Access Object for querying the `fields` table and translating the
 * results into `Field` objects.
 *
 * @see `fields` table in `database/initialization-scripts/schema.sql`
 * @see `packages/model/src/types/Field.ts`
 */
export default class FieldDAO {
    core: Core
    selectionString: string

    /**
     * Construct the DAO from a `Core` object.
     */
    constructor(core: Core) {
        this.core = core

        /**
         * SQL used to select a full field object.  Stored as a variable
         * because function calls can be expensive.
         *
         * Useful for when we want to select field objects into joins.
         * Especially in other DAOs.
         */
        this.selectionString = `
            fields.id as Field_id, fields.name as Field_name, fields.type as Field_type,
            fields.depth as Field_depth, fields.average_reputation as "Field_averageReputation",
            fields.description as Field_description, 
            fields.created_date as "Field_createdDate", fields.updated_date as "Field_updatedDate"
        `
    }

    /**
     * Hydrate a single Field object from a single QueryResultRow.
     *
     * @param {QueryResultRow} row  The database result, must at least include
     * `this.selectionString`.  May include additional data, which will be
     * ignored.
     *
     * @return {Field} A Field object hydrated from the QueryResultRow.
     */
    hydrateField(row: QueryResultRow ): Field {
        return  {
            id: row.Field_id,
            name: row.Field_name,
            type: row.Field_type,
            depth: row.Field_depth,
            averageReputation: row.Field_averageReputation,
            description: row.Field_description,
            createdDate: row.Field_createdDate,
            updatedDate: row.Field_updatedDate
        }
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {QueryResultRow[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydrateFields(rows: QueryResultRow[]): DatabaseResult<Field> {
        const dictionary: ModelDictionary<Field> = {}
        const list: number[] = []

        for(const row of rows) {
            const field = this.hydrateField(row)

            if ( ! dictionary[field.id] ) {
                dictionary[field.id] = field
                list.push(field.id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Select fields using an optional parameterized SQL `WHERE` statement. May
     * also include an order statement and paging.
     *
     * @param {string} whereStatement   (Optional) SQL `WHERE` statement,
     * parameterized for use with `pg:Pool.query`. If left out, all fields will
     * be returned.
     * @param {any[]} parameters    (Optional) An array of parameters matching the parameterization of whereStatement.
     * @param {string} orderStatement   (Optional) An SQL `ORDER` statement.
     * @param {number} page     (Optional) The page of results to load.
     *
     * @return {Promise<DatabaseResult<Field>>}     A promise that resolves to
     * a DatabaseResult<Field> with the requested fields in hydrated Field
     * objects.
     */
    async selectFields(whereStatement?: string, parameters?: any[], orderStatement?: string, page?: number): Promise<DatabaseResult<Field>> {
        const params = parameters ? [ ...parameters ] : []
        let where = whereStatement ? whereStatement : ''
        let order = orderStatement ? orderStatement : 'fields.depth asc, fields.name asc'

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( page ) {
            page = page ? page : 1
            
            const offset = (page-1) * PAGE_SIZE
            let count = params.length 

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(PAGE_SIZE)
            params.push(offset)
        }

        const sql = `
               SELECT 
                   ${this.selectionString}
                FROM fields
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.core.database.query(sql, params)
        return this.hydrateFields(results.rows)
    }

    /**
     * Gets the total number of fields included in a query and returns them in
     * the form of an initial PageMetadata.
     *
     * @param {string} where    (Optional) The SQL `WHERE` statement to be used
     * with the query, parameterized for use with `pg:Pool.query`.
     * @param {any[]} params    (Optional) The parameters for use with `where`.
     * @param {number} page     (Optional) The page being requested.  Isn't
     * used for the query but is passed through to the returned metadata.
     * Defaults to `1` if not provided.
     *
     * @return {Promise<PageMetadata>}  The resulting PageMetdata.
     */
    async countFields(where?: string, params?: any[], page?: number): Promise<PageMetadata> {
        params = params ? params : []
        where = where ? where : ''
        page = page ? page : 1

        const sql = `
               SELECT 
                 COUNT(fields.id) as count
                FROM fields
                ${where} 
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                page: page,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: Math.floor(parseInt(count) / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }
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
