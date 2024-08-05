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
import { Field } from '@journalhub/model'
import { DataAccess, DAOQuery, DAOQueryOrder, DAOResult } from '@journalhub/data-access'
import { FieldLibrary } from '@journalhub/library'

import { FieldAPIQuery } from '../../types/FieldAPIQuery'
import { APIQueryOptions } from '../../types/APIQuery'
import { APIEntityResult, APIQueryResult, APIRelations } from '../../types/APIResult'

import { APIError } from '../../errors/APIError'


/******************************************************************************
 *      FieldController
 *
 * Restful routes for manipulating fields.
 *
 ******************************************************************************/
export class FieldController {
    core: Core
    dao: DataAccess

    fieldLibrary: FieldLibrary 

    constructor(core: Core, dao: DataAccess) {
        this.core = core
        this.dao = dao

        this.fieldLibrary = new FieldLibrary(core)
    }

    /**
     * Get related entities.  Currently a no-op as no related entities have
     * been implemented.
     */
    async getRelations(results: DAOResult<Field> , requestedRelations?: string[]): Promise<APIRelations> {
        const relations: APIRelations = {}

        if ( requestedRelations && "paper" in requestedRelations ) {
            const paperResults = await this.dao.paper.selectPapers({
                where: 'paper_fields.field_id = ANY($1::bigint[])',
                params: [ results.list ]
            })

            relations.papers = paperResults.dictionary
        }

        return relations 
    }

    /**
     * Build a query object from the query string that can be used with both
     * `FieldDAO::selectFields()` and `FieldDAO::countFields()`.
     */
    async parseQuery(query: FieldAPIQuery, options?: APIQueryOptions): Promise<DAOQuery> {
        options = options || {
            ignorePage: false
        }

        const result: DAOQuery = {}

        if ( ! query) {
            return result 
        }

        result.where = ''
        result.params = []
        result.page = 1
        result.empty = false

        if ( typeof query.name !== "undefined" ) {
            if ( ! Array.isArray(query.name) ) {
                result.params.push(query.name)
                result.where += `fields.name % $${result.params.length}`
                result.order = DAOQueryOrder.Override
                result.orderOverride = 
                    `SIMILARITY(fields.name, $${result.params.length}) desc`
            } else if ( typeof query.name === "string" ) {
                result.params.push(query.name)
                result.where += 
                    `fields.name = ANY($${result.params.length}::varchar[])`
            } else {
                throw new APIError(400, 'invalid-name',
                                          `Invalid name "${query.name}" provided.`)
            }
        }

        if ( typeof query.id !== "undefined" ) {
            if ( Array.isArray(query.id) ) {
                result.params.push(query.id)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.params.length}::int[])`
            } else if (typeof query.name === "number" ) {
                result.params.push(query.id)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.id = $${result.params.length}`
            } else {
                throw new APIError(400, 'invalid-id',
                                          `Invalid id "${query.id}" provided.`)
            }
        }

        if ( typeof query.type !== "undefined" ) {
            if ( Array.isArray(query.type) ) {
                result.params.push(query.type)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''}
                        fields.type = ANY($${result.params.length}::varchar[])`
            } else if (typeof query.type === "string" ) {
                result.params.push(query.type)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.type = $${result.params.length}`
            } else {
                throw new APIError(400, 'invalid-type',
                                          `Invalid type "${query.type}" provided.`)
            }
        }

        if ( typeof query.depth !== "undefined" ) {
            if ( Array.isArray(query.depth) ) {
                result.params.push(query.depth)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.depth = ANY($${result.params.length}::int[])`
            } else if ( typeof query.depth === "number" ) {
                result.params.push(query.depth)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.depth = $${result.params.length}`
            } else {
                throw new APIError(400, 'invalid-depth',
                                          `Invalid depth "${query.depth}" provided.`)
            }
        }

        if ( typeof query.parent !== "undefined" ) {
            if ( Array.isArray(query.parent) ) {
                const childIds = []
                for(const id of query.parent) {
                    childIds.push(await this.fieldLibrary.selectFieldChildren(id))
                }
                result.params.push(childIds)
                result.where += `${ result.params.length > 1 ? ' AND ' : ''} 
                    fields.id = ANY($${result.params.length}::int[])`
            } else if ( typeof query.parent === "number" ) {
                const childIds = await this.fieldLibrary.selectFieldChildren(query.parent)
                result.params.push(childIds)
                result.where += `${ result.params.length > 1 ? ' AND ' : ''} 
                    fields.id = ANY($${result.params.length}::int[])`
            } else {
                throw new APIError(400, 'invalid-parent',
                                          `Invalid parent "${query.parent}" provided.`)
            }
        }

        if ( typeof query.child !== "undefined" ) {
            if ( Array.isArray(query.child) ) {
                const parentIds = []
                for( const id of query.child ) {
                    parentIds.push(await this.fieldLibrary.selectFieldParents(id))
                }

                result.params.push(parentIds)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.params.length}::int[])`

            } else if ( typeof query.child == "number" ) {
                const parentIds = await this.fieldLibrary.selectFieldParents(query.child)

                result.params.push(parentIds)
                result.where += 
                    `${ result.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.params.length}::int[])`
            } else {
                throw new APIError(400, 'invalid-child',
                                          `Invalid child "${query.child}" provided.`)
            }
        }

        if ( typeof query.page == "number" && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        return result 
    }

    /**
     * GET /fields
     *
     * Responds with a `results` object with meta containing meta data about
     * the results set (page, count, etc) and results containing an array of
     * results.
     */
    async getFields(query: FieldAPIQuery): Promise<APIQueryResult<Field>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const parsedQuery = await this.parseQuery(query)

        const results: APIQueryResult<Field> = {
            meta: {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }, 
            dictionary: {},
            list: [],
            relations: {}
        }

        if ( parsedQuery.empty) {
            return results
            
        }
        
        const databaseResult = await this.dao.field.selectFields(parsedQuery)
        results.dictionary = databaseResult.dictionary
        results.list = databaseResult.list

        results.meta = await this.dao.field.getFieldQueryMeta(parsedQuery)

        results.relations = await this.getRelations(databaseResult, query.relations)

        return results
    }

    /**
     * POST /fields
     *
     * Create a new field in the this.core.database from the provided JSON.
     */
    async postFields(): Promise<void> {
        throw new APIError(501, 'not-implemented', `Attempt to create a new field, but it's not implemented yet.`)
        // TODO Commenting this out until we need it in Issue #95.
        /*if ( ! request.session || ! request.session.user ) {
            throw new APIError(403, 'not-authorized', `Attempt to create a new field from an unauthenticated user.`)
        }

        const field = request.body

        // If a field already exists with that name, send a 400 error.
        //
        const fieldExistsResults = await this.core.database.query(
            'SELECT id, name FROM fields WHERE name=$1',
            [ field.name ]
        )

        if (fieldExistsResults.rowCount > 0) {
            throw new APIError(400, 'field-exists', `Attempt to create a new field(${field.name}), when a field of that name already exists.`)
        }

        field.id = await this.dao.field.insertField(field)
        await this.dao.field.insertFieldRelationships(field)

        const returnFields = await this.dao.field.selectFields('WHERE fields.id=$1', [results.rows[0].id])
        if ( returnFields.length <= 0) {
            throw new APIError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(201).json(returnFields[0])*/
    }

    /**
     * GET /field/:id
     *
     * Get details for a single field in the database.
     */
    async getField(id: number): Promise<APIEntityResult<Field>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const results = await this.dao.field.selectFields({ 
            where: 'fields.id = $1',
            params: [id]
        })

        if ( ! ( id in results.dictionary )) {
            throw new APIError(404, 'no-resource', `Failed to find Field(${id})`)
        }

        const relations = await this.getRelations(results)

        return { 
            entity: results.dictionary[id],
            relations: relations
        }
    }

    /**
     * PUT /field/:id
     *
     * Replace an existing field wholesale with the provided JSON.
     */
    async putField(): Promise<void> {
        throw new APIError(501, 'not-implemented', `Attempt to PUT field, but that's not implemented yet.`)
        // TODO Commenting this out until its needed for Issue #95.
        /*const field = request.body
        const results = await this.core.database.query(`
                    UPDATE fields SET name = $1 AND parent_id = $2 AND updated_date = now() 
                        WHERE id = $3 
                        RETURNING id
                `,
            [ field.name, field.parent_id, request.params.id ]
        )

        if (results.rowCount == 0 && results.rows.length == 0) {
            throw new APIError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        const returnFields = await this.dao.field.selectFields('WHERE fields.id=$1', results.rows[0].id)
        if ( returnFields.length <= 0) {
            throw new APIError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])*/
    }

    /**
     * PATCH /field/:id
     *
     * Update an existing field given a partial set of fields in JSON.
     */
    async patchField(): Promise<void> {
        throw new APIError(501, 'not-implemented',
            `Attempt to patch a field, but it's not implemented.`)
        // TODO Commented out until its needed for Issue #95. 
        /*const field = request.body
        field.id = request.params.id

        let sql = 'UPDATE fields SET '
        let params = []
        let count = 1
        for(let key in field) {
            if ( key == 'id' ) {
                continue
            }

            sql += `${key} = $${count} and `

            params.push(field[key])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`
        params.push(field.id)

        const results = await this.core.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new APIError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        const returnFields = await this.dao.field.selectFields('WHERE fields.id=$1', [field.id])
        if ( returnFields.length <= 0) {
            throw new APIError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])*/
    }

    /**
     * DELETE /field/:id
     *
     * Delete an existing field.
     */
    async deleteField(): Promise<void> {
        throw new APIError(501, 'not-implemented',
            `Attempt to delete a field, but it's not implemented.`)
        // TODO commented out until its needed for Issue #95.
        /*const results = await this.core.database.query(
            'delete from fields where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            throw new APIError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        return response.status(200).json({fieldId: request.params.id})*/
    }
} 
