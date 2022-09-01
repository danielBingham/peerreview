
const PAGE_SIZE = 100 

module.exports = class FieldDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
    }

    validateField(field) {
        // Validate the `name` field
        if ( field.name.length < 3) {
            throw new ValidationError('name', 'length', 'Field names must be at least 3 characters long.')
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
        if ( rows.length == 0 ) {
            return null 
        }

        const fields = {}
        const list = []

        for(const row of rows) {
            const field = {
                id: row.field_id,
                name: row.field_name,
                type: row.field_type,
                description: row.field_description,
                createdDate: row.field_createdDate,
                updatedDate: row.field_updatedDate,
                parents: [],
                children: []
            }

            if ( ! fields[field.id] ) {
                fields[field.id] = field
                list.push(field)
            }

            if ( row.parent_id && ! fields[row.field_id].parents.find((p) => p == row.parent_id) ) {
                fields[row.field_id].parents.push(row.parent_id)
            }

            if ( row.child_id && ! fields[row.field_id].children.find((c) => c == row.child_id)) {
                fields[row.field_id].children.push(row.child_id)
            }
        }

        return list 
    }

    async selectFields(where, params, order, page) {
        params = params ? params : []
        where = where ? where : ''
        order = order ? order : 'fields.name asc'
        page = page ? page : 1
        
        const offset = (page-1) * PAGE_SIZE
        let count = params.length 

        params.push(PAGE_SIZE)
        params.push(offset)

        const sql = `
               SELECT 
                    fields.id as field_id, fields.name as field_name, fields.type as field_type, fields.description as field_description, fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate"
                FROM fields
                ${where} 
                ORDER BY ${order} 
                LIMIT $${count+1}
                OFFSET $${count+2}
        `

        console.log(sql)
        console.log(params)

        const results = await this.database.query(sql, params)
        return this.hydrateFields(results.rows)
    }

    async countFields(where, params) {
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
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }
    }

    async selectFieldsWithOutParent() {
        const results = await this.database.query(`
            SELECT fields.id FROM fields 
                LEFT OUTER JOIN field_relationships on fields.id = field_relationships.child_id 
                WHERE field_relationships.parent_id is null
         `, [ ])

        if ( results.rows.length <= 0) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async selectFieldsWithParent(parentId) {
        const results = await this.database.query(`
            SELECT child_id FROM field_relationships WHERE parent_id = $1
         `, [ parentId ])

        if ( results.rows.length <= 0) {
            return []
        }

        return results.rows.map((r) => r.child_id)
    }


    /**
     * Select the entire tree under a single field.
     *
     * @param {int[]} fieldIds An array of field ids the children of which we
     * want to select.
     */
    async selectFieldChildren(rootIds) {
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
    async selectFieldParents(rootIds) {
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
