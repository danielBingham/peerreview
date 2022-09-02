/******************************************************************************
 *      FieldController
 *
 * Restful routes for manipulating fields.
 *
 ******************************************************************************/
const FieldDAO = require('../daos/field')
const ControllerError = require('../errors/ControllerError')


module.exports = class FieldController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.fieldDAO = new FieldDAO(database, logger)
    }

    async parseQuery(query, options) {
        options = options || {
            ignorePage: false
        }

        if ( ! query) {
            return
        }

        let count = 0

        const result = {
            where: 'WHERE',
            params: [],
            page: 1,
            order: '',
            emptyResult: false
        }

        if ( query.name && query.name.length > 0) {
            count += 1
            result.where += ` fields.name % $${count}`
            result.params.push(query.name)
            result.order = `SIMILARITY(fields.name, $${count}) desc`

        }

        if ( query.parent ) {
            count += 1
            const childIds = await this.fieldDAO.selectFieldChildren(query.parent)
            result.where += `${ count > 1 ? ' AND ' : ''} fields.id = ANY($${count}::int[])`
            result.params.push(childIds)
        }

        if ( query.child ) {
            count += 1
            const parentIds = await this.fieldDAO.selectFieldParents(query.child)
            result.where += `${ count > 1 ? ' AND ' : ''} fields.id = ANY($${count}::int[])`
            result.params.push(parentIds)
        }

        if ( query.depth ) {
            count += 1
            result.where += `${ count > 1 ? ' AND ' : ''} fields.depth = $${count}`
            result.params.push(query.depth)
        }

        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        // We didn't end up adding any parameters.
        if ( result.where == 'WHERE') {
            result.where = ''
        }

        return result 
    }

    /**
     * GET /fields
     *
     * Return a JSON array of all fields in thethis.database.
     */
    async getFields(request, response) {
        const { where, params, order, page, emptyResult } = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                result: []
            })
        }
        
        const meta = await this.fieldDAO.countFields(where, params)
        const fields = await this.fieldDAO.selectFields(where, params, order, page)
        return response.status(200).json({
            meta: meta,
            result: fields
        })
    }

    /**
     * POST /fields
     *
     * Create a new field in the this.database from the provided JSON.
     */
    async postFields(request, response) {
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Attempt to create a new field from an unauthenticated user.`)
        }

        const field = request.body

        // If a field already exists with that name, send a 400 error.
        //
        const fieldExistsResults = await this.database.query(
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
        return response.status(201).json(returnFields[0])
    }

    /**
     * GET /field/:id
     *
     * Get details for a single field in the database.
     */
    async getField(request, response) {
        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id = $1', [request.params.id])

        if ( returnFields.length <= 0 ) {
            return response.status(404).json({})
        }

        return response.status(200).json(returnFields[0])
    }

    /**
     * PUT /field/:id
     *
     * Replace an existing field wholesale with the provided JSON.
     */
    async putField(request, response) {
        const field = request.body
        const results = await this.database.query(`
                    UPDATE fields SET name = $1 AND parent_id = $2 AND updated_date = now() 
                        WHERE id = $3 
                        RETURNING id
                `,
            [ field.name, field.parent_id, request.params.id ]
        )

        if (results.rowCount == 0 && results.rows.length == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id=$1', results.rows[0].id)
        if ( returnFields.length <= 0) {
            throw new ControllerError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])
    }

    /**
     * PATCH /field/:id
     *
     * Update an existing field given a partial set of fields in JSON.
     */
    async patchField(request, response) {
        const field = request.body
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

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            return response.status(404).json({error: 'no-resource'})
        }

        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id=$1', [field.id])
        if ( returnFields.length <= 0) {
            throw new ControllerError(500, 'server-error', `Field(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnFields[0])
    }

    /**
     * DELETE /field/:id
     *
     * Delete an existing field.
     */
    async deleteField(request, response) {
        const results = await this.database.query(
            'delete from fields where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        return response.status(200).json({fieldId: request.params.id})
    }
} 
