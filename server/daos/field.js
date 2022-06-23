module.exports = class FieldDAO {

    constructor(database) {
        this.database = database
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

        for(const row of rows) {
            const field = {
                id: row.id,
                name: row.name,
                parentId: row.parentId,
                type: row.type
            }

            if ( ! fields[field.id] ) {
                fields[field.id] = field
            }
        }

        return fields
    }

    async selectFields(where, params) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                    id, name, parent_id as "parentId", type, created_date as "createdDate", updated_date as "updatedDate"
                FROM fields 
                ${where} 
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return null
        } else {
            const fields = this.hydrateFields(results.rows)
            return Object.values(fields)
        }
    }

    /**
     * Select the entire tree under a single field.
     *
     * @param {int[]} fieldIds An array of field ids the children of which we
     * want to select.
     */
    async selectFieldChildren(rootIds) {
        console.log('rootIds')
        console.log(rootIds)
        const fieldIds = [ ...rootIds]
        console.log('fieldIds')
        console.log(fieldIds)
        let previous = [ ...rootIds]
        do {
            const results = await this.database.query(`SELECT id FROM fields WHERE parent_id = ANY ($1::int[])`, [ previous ])

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


}
