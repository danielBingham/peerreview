
module.exports = class UserDAO {


    constructor(database) {
        this.database = database
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows) {
        if ( rows.length == 0 ) {
            return null 
        }

        const users = {};

        for( const row of rows ) {
            const user = {
                id: row.user_id,
                name: row.user_name,
                email: row.user_email,
                bio: row.user_bio,
                location: row.user_location,
                institution: row.user_institution,
                initialReputation: row.user_initialReputation,
                reputation: row.user_reputation,
                createdDate: row.user_createdDate,
                updatedDate: row.user_updatedDate,
                fields: []
            }
            if ( ! users[row.user_id] ) {
                users[user.id] = user
            }
            const userField = {
                reputation: row.field_reputation,
                field: {
                    id: row.field_id,
                    name: row.field_name,
                    description: row.field_description,
                    type: row.field_type,
                    createdDate: row.field_createdDate,
                    updatedDate: row.field_updatedDate
                }
            }
            if ( userField.field.id && ! users[row.user_id].fields.find((f) => f.field.id == userField.field.id) ) {
                users[row.user_id].fields.push(userField)
            }
                
        }

        return users;
    }

    async selectUsers(where, params) {
        if ( ! where ) {
            where = ''
        } 
        if ( ! params ) {
            params = []
        }

        const sql = `
                SELECT 
                    users.id as user_id, users.name as user_name, users.email as user_email, users.bio as user_bio, users.location as user_location, users.institution as user_institution, users.initial_reputation as "user_initialReputation", users.reputation as user_reputation, users.created_date as "user_createdDate", users.updated_date as "user_updatedDate",
                    user_field_reputation.reputation as field_reputation,
                    fields.id as field_id, fields.name as field_name, fields.description as field_description, fields.type as field_type, fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate"
                FROM users
                LEFT OUTER JOIN user_field_reputation on users.id = user_field_reputation.user_id
                LEFT OUTER JOIN fields on fields.id = user_field_reputation.field_id
                ${where} 
        `;

        const results = await this.database.query(sql, params);

        if ( results.rows.length == 0 ) {
            return [] 
        } else {
            const users = this.hydrateUsers(results.rows)
            return Object.values(users);
        }
    }

    async selectUserPapers(id) {

        const sql = `
            SELECT DISTINCT
                papers.id
            FROM papers
                LEFT OUTER JOIN paper_authors on papers.id = paper_authors.paper_id
            WHERE paper_authors.user_id = $1
        `

        const results = await this.database.query(sql, [ id ])

        if ( results.rows.length == 0) {
            return null
        }

        let paperIds = []
        for ( const row of results.rows ) {
            paperIds.push(row.id)
        }
        return paperIds
    }

}
