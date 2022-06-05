module.exports = class FieldService {

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

        const fields = {};

        for(const row of rows) {
            const field = {
                id: row.id,
                name: row.name,
                parentId: row.parentId
            };

            if ( ! fields[field.id] ) {
                fields[field.id] = field;
            }
        }

        return fields;
    }

    async selectFields(where, params) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                    id, name, parent_id as "parentId", created_date as "createdDate", updated_date as "updatedDate"
                FROM fields 
                ${where} 
        `;

        const results = await this.database.query(sql, params);

        if ( results.rows.length == 0 ) {
            return null
        } else {
            const fields = this.hydrateFields(results.rows)
            if ( ids && ! Array.isArray(ids) ) {
                return fields[ids];
            } else {
                return Object.values(fields);
            }
        }
    }


}
