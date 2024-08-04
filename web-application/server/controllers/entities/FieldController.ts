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
import { Field, FieldQuery, QueryResult } from '@danielbingham/peerreview-model'
import { FieldDAO, FieldLibrary, PaperDAO, DAOQueryOrder } from '@danielbingham/peerreview-backend'

import { ControllerQueryOptions, ControllerQuery } from '../../types/ControllerQuery'

import { ControllerError } from '../../errors/ControllerError'


/******************************************************************************
 *      FieldController
 *
 * Restful routes for manipulating fields.
 *
 ******************************************************************************/
export class FieldController {
    core: Core

    fieldDAO: FieldDAO

    fieldLibrary: FieldLibrary 

    constructor(core: Core) {
        this.core = core

        this.fieldDAO = new FieldDAO(core)

        this.fieldLibrary = new FieldLibrary(core)
    }

    /**
     * Get related entities.  Currently a no-op as no related entities have
     * been implemented.
     */
    async getRelations(results, requestedRelations) {

        if ( requestedRelations ) {
            if ( "paper" in requestedRelations ) {


            }

        }
        return {}
    }

    /**
     * Build a query object from the query string that can be used with both
     * `FieldDAO::selectFields()` and `FieldDAO::countFields()`.
     */
    async parseQuery(query: FieldQuery, options?: ControllerQueryOptions) {
        options = options || {
            ignorePage: false
        }

        const result: ControllerQuery = {
            daoQuery: {
                where: '',
                params: [],
                page: 1
            },
            requestedRelations: query.relations ? query.relations : [],
            emptyResult: false
        }

        if ( ! query) {
            return result
        }

        if ( typeof query.name !== "undefined" ) {
            if ( ! Array.isArray(query.name) ) {
                result.daoQuery.params.push(query.name)
                result.daoQuery.where += `fields.name % $${result.daoQuery.params.length}`
                result.daoQuery.order = DAOQueryOrder.Override
                result.daoQuery.orderOverride = 
                    `SIMILARITY(fields.name, $${result.daoQuery.params.length}) desc`
            } else if ( typeof query.name === "string" ) {
                result.daoQuery.params.push(query.name)
                result.daoQuery.where += 
                    `fields.name = ANY($${result.daoQuery.params.length}::varchar[])`
            } else {
                throw new ControllerError(400, 'invalid-name',
                                          `Invalid name "${query.name}" provided.`)
            }
        }

        if ( typeof query.id !== "undefined" ) {
            if ( Array.isArray(query.id) ) {
                result.daoQuery.params.push(query.id)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.daoQuery.params.length}::int[])`
            } else if (typeof query.name === "number" ) {
                result.daoQuery.params.push(query.id)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.id = $${result.daoQuery.params.length}`
            } else {
                throw new ControllerError(400, 'invalid-id',
                                          `Invalid id "${query.id}" provided.`)
            }
        }

        if ( typeof query.type !== "undefined" ) {
            if ( Array.isArray(query.type) ) {
                result.daoQuery.params.push(query.type)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''}
                        fields.type = ANY($${result.daoQuery.params.length}::varchar[])`
            } else if (typeof query.type === "string" ) {
                result.daoQuery.params.push(query.type)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.type = $${result.daoQuery.params.length}`
            } else {
                throw new ControllerError(400, 'invalid-type',
                                          `Invalid type "${query.type}" provided.`)
            }
        }

        if ( typeof query.depth !== "undefined" ) {
            if ( Array.isArray(query.depth) ) {
                result.daoQuery.params.push(query.depth)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.depth = ANY($${result.daoQuery.params.length}::int[])`
            } else if ( typeof query.depth === "number" ) {
                result.daoQuery.params.push(query.depth)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.depth = $${result.daoQuery.params.length}`
            } else {
                throw new ControllerError(400, 'invalid-depth',
                                          `Invalid depth "${query.depth}" provided.`)
            }
        }

        if ( typeof query.parent !== "undefined" ) {
            if ( Array.isArray(query.parent) ) {
                const childIds = []
                for(const id of query.parent) {
                    childIds.push(await this.fieldLibrary.selectFieldChildren(id))
                }
                result.daoQuery.params.push(childIds)
                result.daoQuery.where += `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                    fields.id = ANY($${result.daoQuery.params.length}::int[])`
            } else if ( typeof query.parent === "number" ) {
                const childIds = await this.fieldLibrary.selectFieldChildren(query.parent)
                result.daoQuery.params.push(childIds)
                result.daoQuery.where += `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                    fields.id = ANY($${result.daoQuery.params.length}::int[])`
            } else {
                throw new ControllerError(400, 'invalid-parent',
                                          `Invalid parent "${query.parent}" provided.`)
            }
        }

        if ( typeof query.child !== "undefined" ) {
            if ( Array.isArray(query.child) ) {
                const parentIds = []
                for( const id of query.child ) {
                    parentIds.push(await this.fieldLibrary.selectFieldParents(id))
                }

                result.daoQuery.params.push(parentIds)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.daoQuery.params.length}::int[])`

            } else if ( typeof query.child == "number" ) {
                const parentIds = await this.fieldLibrary.selectFieldParents(query.child)

                result.daoQuery.params.push(parentIds)
                result.daoQuery.where += 
                    `${ result.daoQuery.params.length > 1 ? ' AND ' : ''} 
                        fields.id = ANY($${result.daoQuery.params.length}::int[])`
            } else {
                throw new ControllerError(400, 'invalid-child',
                                          `Invalid child "${query.child}" provided.`)
            }
        }

        if ( typeof query.page == "number" && ! options.ignorePage ) {
            result.daoQuery.page = query.page
        } else if ( ! options.ignorePage ) {
            result.daoQuery.page = 1
        }

        return result 
    }

    /**
     * GET /fields
     *
     * Responds with a `results` object with meta containing meta data about
     * the results set (page, count, etc) and results containing an array of
     * results.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.query    (Optional) Query data used to shape the result set.
     * @param {string} request.query.name   (Optional) The name, or partial name, of a
     * field we're searching for.
     * @param {int} request.query.parent    (Optional) The fieldId of a parent field who's
     * children we'd like to query for.
     * @param {int} request.query.child     (Optional) The fieldId of a child
     * field who's parents we'd like to select.
     * @param {int} request.query.depth     (Optional) A depth.  We'll restrict
     * the query to only fields that exist at that depth in the tree.
     * @param {int} request.query.page      (Optional) The results page to
     * return.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getFields(query: FieldQuery): Promise<QueryResult<Field>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const parsedQuery = await this.parseQuery(query)

        const results: QueryResult<Field> = {
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

        if ( parsedQuery.emptyResult ) {
            return results
            
        }
        
        const databaseResult = await this.fieldDAO.selectFields(parsedQuery.daoQuery)
        results.dictionary = databaseResult.dictionary
        results.list = databaseResult.list

        results.meta = await this.fieldDAO.getFieldQueryMeta(parsedQuery.daoQuery)

        results.relations = await this.getRelations(results, parsedQuery.requestedRelations)

        return results
    }

    /**
     * POST /fields
     *
     * Create a new field in the this.core.database from the provided JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postFields(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to create a new field, but it's not implemented yet.`)
        // TODO Commenting this out until we need it in Issue #95.
        /*if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Attempt to create a new field from an unauthenticated user.`)
        }

        const field = request.body

        // If a field already exists with that name, send a 400 error.
        //
        const fieldExistsResults = await this.core.database.query(
            'SELECT id, name FROM fields WHERE name=$1',
            [ field.name ]
        )

        if (fieldExistsResults.rowCount > 0) {
            throw new ControllerError(400, 'field-exists', `Attempt to create a new field(${field.name}), when a field of that name already exists.`)
        }

        field.id = await this.fieldDAO.insertField(field)
        await this.fieldDAO.insertFieldRelationships(field)

        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id=$1', [results.rows[0].id])
        if ( returnFields.length <= 0) {
            throw new ControllerError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(201).json(returnFields[0])*/
    }

    /**
     * GET /field/:id
     *
     * Get details for a single field in the database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of a Field.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getField(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const results = await this.fieldDAO.selectFields('WHERE fields.id = $1', [request.params.id])

        if ( results.length <= 0 ) {
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.list[0],
            relations: relations
        })
    }

    /**
     * PUT /field/:id
     *
     * Replace an existing field wholesale with the provided JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async putField(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to PUT field, but that's not implemented yet.`)
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
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id=$1', results.rows[0].id)
        if ( returnFields.length <= 0) {
            throw new ControllerError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])*/
    }

    /**
     * PATCH /field/:id
     *
     * Update an existing field given a partial set of fields in JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchField(request, response) {
        throw new ControllerError(501, 'not-implemented',
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
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id=$1', [field.id])
        if ( returnFields.length <= 0) {
            throw new ControllerError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])*/
    }

    /**
     * DELETE /field/:id
     *
     * Delete an existing field.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteField(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `Attempt to delete a field, but it's not implemented.`)
        // TODO commented out until its needed for Issue #95.
        /*const results = await this.core.database.query(
            'delete from fields where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        return response.status(200).json({fieldId: request.params.id})*/
    }
} 
