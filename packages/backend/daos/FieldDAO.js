
const PAGE_SIZE = 20 

module.exports = class FieldDAO {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger

        /**
         * SQL used to select a full field object.  Stored as a variable
         * because function calls can be expensive.
         *
         * Useful for when we want to select field objects into joins.
         * Especially in other DAOs.
         */
        this.selectionString = `
            fields.id as field_id, fields.name as field_name, fields.type as field_type,
            fields.depth as field_depth, fields.average_reputation as "field_averageReputation", fields.description as field_description, 
            fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate"
        `
    }

    validateField(field) {
        // Validate the `name` field
        if ( field.name.length < 3) {
            throw new ValidationError('name', 'length', 'Field names must be at least 3 characters long.')
        }
    }

    hydrateField(row) {
        return  {
            id: row.field_id,
            name: row.field_name,
            type: row.field_type,
            depth: row.field_depth,
            averageReputation: row.field_averageReputation,
            description: row.field_description,
            createdDate: row.field_createdDate,
            updatedDate: row.field_updatedDate
        }
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydrateFields(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const field = this.hydrateField(row)

            if ( ! dictionary[field.id] ) {
                dictionary[field.id] = field
                list.push(field)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    async selectFields(whereStatement, parameters, orderStatement, page) {
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

        const results = await this.database.query(sql, params)
        return this.hydrateFields(results.rows)
    }

    async countFields(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

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
                page: page ? page : 1,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }
    }

    /**
     * Select the immediate children of parent field identified by `parentId`
     *
     * @param {int} parentId    The id of the field who's children we want to
     * select.
     */
    async selectFieldChildren(parentId) {
        const results = await this.database.query(`
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
     * @param {int} childId The id of the field who's parents we want to
     * select.
     */
    async selectFieldParents(childId) {
        const results = await this.database.query(`
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
     * @param {int[]} rootIds An array of field ids who's descendents we want
     * to select. 
     **/
    async selectFieldDescendents(rootIds) {
        const fieldIds = [ ...rootIds]
        let previous = [ ...rootIds]
        do {
            const results = await this.database.query(`SELECT child_id as id FROM field_relationships WHERE field_relationships.parent_id = ANY ($1::int[])`, [ previous ])

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
     * @param {int[]} fieldIds An array of field ids the children of which we
     * want to select.
     */
    async selectFieldAncestors(rootIds) {
        const fieldIds = [ ...rootIds]
        let previous = [ ...rootIds]
        do {
            const results = await this.database.query(`SELECT parent_id as id FROM field_relationships WHERE field_relationships.child_id = ANY ($1::int[])`, [ previous ])

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

    async insertField(field) {
        const results = await this.database.query(`
                    INSERT INTO fields (name, parent_id,  created_date, updated_date) 
                        VALUES ($1, $2, now(), now()) 
                        RETURNING id

                `, 
            [ field.name, field.parentId ]
        )

        if ( results.rowCount == 0 ) {
            throw new Error('Insert field failed.')
        }


    }


}
