/******************************************************************************
 *      FieldController
 *
 * Restful routes for manipulating fields.
 *
 ******************************************************************************/
const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')


module.exports = class FieldController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.fieldDAO = new backend.FieldDAO(database, logger)
    }

    /**
     * Helper method.
     *
     * Build a query object from the query string that can be used with both
     * `FieldDAO::selectFields()` and `FieldDAO::countFields()`.
     *
     * @param {Object} query    (Optional) Query data used to shape the result set.
     * @param {string} query.name   (Optional) The name, or partial name, of a
     * field we're searching for.
     * @param {int} query.parent    (Optional) The fieldId of a parent field who's
     * children we'd like to query for.
     * @param {int} query.child     (Optional) The fieldId of a child
     * field who's parents we'd like to select.
     * @param {int} query.depth     (Optional) A depth.  We'll restrict
     * the query to only fields that exist at that depth in the tree.
     * @param {int} query.page      (Optional) The results page to
     * return.
     *
     * @returns {Object}    Returns a results object who's pieces can be passed
     * to either `FieldDAO::selectFields()` or `FieldDAO::countFields()`.  The
     * result object has the following structure: 
     *
     * ```
     * {
     *  where: '', // SQL, the WHERE portion of the query (including the WHERE keyword).
     *  params: [], // A parameter array matching the `$d` parameters in the `where` statement.
     *  page: 1, // A page defining which page of the results set we want.
     *  order: '', // An order parameter, understandable by select and count.
     *  emptyResult: false // Will be `true` if there's an empty result set,
     *  // allowing us to by pass the call to count or select.
     *  }
     *  ```
     */
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

        if ( query.ids ) {
            count += 1
            result.where += `${ count > 1 ? ' AND ' : ''} fields.id = ANY($${count}::int[])`
            result.params.push(query.ids)
            options.ignorePage = true
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
    async getFields(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const { where, params, order, page, emptyResult } = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                result: []
            })
        }
        
        const meta = await this.fieldDAO.countFields(where, params, page)
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
        const returnFields = await this.fieldDAO.selectFields('WHERE fields.id = $1', [request.params.id])

        if ( returnFields.length <= 0 ) {
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        return response.status(200).json(returnFields[0])
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
        const results = await this.database.query(`
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

        const results = await this.database.query(sql, params)

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
        /*const results = await this.database.query(
            'delete from fields where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            throw new ControllerError(404, 'no-resource', `Failed to find Field(${request.params.id})`)
        }

        return response.status(200).json({fieldId: request.params.id})*/
    }
} 
