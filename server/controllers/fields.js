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

    /**
     * GET /fields
     *
     * Return a JSON array of all fields in thethis.database.
     */
    async getFields(request, response) {
        let where = 'WHERE'
        let params = []
        if ( request.query ) {
            if ( request.query.name && request.query.name.length > 0) {
                where += ` fields.name ILIKE $1`
                params.push(request.query.name+'%')
            }
        }

        // We didn't end up adding any parameters.
        if ( where == 'WHERE') {
            where = ''
        }

        const fields = await this.fieldDAO.selectFields(where, params)

        if ( ! fields ) {
            return response.status(200).json([])
        } else {
            return response.status(200).json(fields)
        }
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

        const returnField = await this.fieldDAO.selectFields('WHERE fields.id=$1', [results.rows[0].id])
        return response.status(201).json(returnField)
    }

    /**
     * GET /field/:id
     *
     * Get details for a single field in thethis.database.
     */
    async getField(request, response) {
        try {
            const returnFields = await this.fieldDAO.selectFields('WHERE fields.id = $1', [request.params.id])

            if ( ! returnFields ) {
                return response.status(404).json({})
            }

            return response.status(200).json(returnFields[0])
        } catch (error) {
            console.error(error)
            return response.status(500).send()
        }
    }

    /**
     * PUT /field/:id
     *
     * Replace an existing field wholesale with the provided JSON.
     */
    async putField(request, response) {
        try {
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

            const returnField = await this.fieldDAO.selectFields('WHERE fields.id=$1', results.rows[0].id)
            return response.status(200).json(returnField)
        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown'})
        }
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

        try {
            const results = await this.database.query(sql, params)

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
            }

            const returnField = await this.fieldDAO.selectFields('WHERE fields.id=$1', [field.id])
            return response.status(200).json(returnField)
        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /field/:id
     *
     * Delete an existing field.
     */
    async deleteField(request, response) {

        try {
            const results = await this.database.query(
                'delete from fields where id = $1',
                [ request.params.id ]
            )

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'})
            }

            return response.status(200).json({fieldId: request.params.id})
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }
} 
