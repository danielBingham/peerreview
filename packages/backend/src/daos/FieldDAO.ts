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

import { QueryResultRow, Pool, Client } from 'pg'

import { Field, DatabaseQuery, DatabaseResult, ModelDictionary, QueryMeta } from '@danielbingham/peerreview-model'

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
    database: Pool | Client

    /**
     * Construct the DAO from a `Core` object.
     */
    constructor(core: Core, database?: Pool | Client) {
        this.core = core
        this.database = this.core.database

        if ( database ) {
            this.database = database
        }
    }

    /**
     * Get the field portion of an SQL SELECT statement that will select fields
     * from the `fields` table and map them to the Field model.
     */
    getFieldSelectionString(): string {
        return `
            fields.id as "Field_id", 
            fields.name as "Field_name", 
            fields.type as "Field_type",
            fields.depth as "Field_depth", 
            fields.average_reputation as "Field_averageReputation",
            fields.description as "Field_description", 
            fields.created_date as "Field_createdDate",
            fields.updated_date as "Field_updatedDate"
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
     */
    async selectFields(query: DatabaseQuery): Promise<DatabaseResult<Field>> {
        const params = query.params ? [ ...query.params ] : []
        let where = `WHERE ${query.where}` || ''
        let order = query.order || 'fields.depth asc, fields.name asc'

        let page = query.page || 0
        let itemsPerPage = query.itemsPerPage || PAGE_SIZE

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( page > 0 ) {
            const offset = (page-1) * itemsPerPage 
            let count = params.length 

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(itemsPerPage)
            params.push(offset)
        }

        const sql = `
               SELECT 
                   ${this.getFieldSelectionString()}
                FROM fields
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydrateFields(results.rows)
    }

    /**
     * Gets the total number of fields included in a query and returns them in
     * the form of an initial QueryMeta.
     */
    async getFieldQueryMeta(query: DatabaseQuery): Promise<QueryMeta> {
        const params = query.params ? [ ...query.params ] : []
        const where = query.where || ''
        
        const page = query.page || 0
        const itemsPerPage = query.itemsPerPage || PAGE_SIZE

        const sql = `
               SELECT 
                 COUNT(fields.id) as count
                FROM fields
                ${where} 
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                page: page,
                pageSize: itemsPerPage,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
            pageSize: itemsPerPage,
            numberOfPages: Math.floor(parseInt(count) / itemsPerPage) + ( count % itemsPerPage > 0 ? 1 : 0) 
        }
    }

}
