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

    async selectFields(where, params) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                    fields.id as field_id, fields.name as field_name, fields.type as field_type, fields.description as field_description, fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate",
                    parents.id as parent_id, children.id as child_id
                FROM fields
                    LEFT OUTER JOIN field_relationships parent_connection on parent_connection.child_id = fields.id
                    LEFT OUTER JOIN fields parents on parents.id = parent_connection.parent_id
                    LEFT OUTER JOIN field_relationships child_connection on child_connection.parent_id = fields.id
                    LEFT OUTER JOIN fields children on children.id = child_connection.child_id
                ${where} 
                ORDER BY fields.name asc
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return null
        } else {
            return this.hydrateFields(results.rows)
        }
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
            const results = await this.database.query(`SELECT fields.id as id FROM fields JOIN field_relationships on fields.id = field_relationships.child_id WHERE field_relationships.parent_id = ANY ($1::int[])`, [ previous ])

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
            const results = await this.database.query(`SELECT fields.id as id FROM fields JOIN field_relationships on fields.id = field_relationships.parent_id WHERE field_relationships.child_id = ANY ($1::int[])`, [ previous ])

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
