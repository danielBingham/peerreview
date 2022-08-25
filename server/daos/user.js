const DAOError = require('../errors/DAOError')

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
     *
     * TODO This needs to preserve order, right now - it doesn't.
     */
    hydrateUsers(rows) {
        if ( rows.length == 0 ) {
            return [] 
        }

        const users = {}
        const list = []

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
                list.push(user)
            }
            const userField = {
                reputation: row.field_reputation,
                field: {
                    id: row.field_id,
                    name: row.field_name,
                    description: row.field_description,
                    type: row.field_type,
                    createdDate: row.field_createdDate,
                    updatedDate: row.field_updatedDate,
                    children: [],
                    parents: []
                }
            }
            if ( userField.field.id && ! users[row.user_id].fields.find((f) => f.field.id == userField.field.id) ) {
                users[row.user_id].fields.push(userField)
            }
                
        }

        return list 
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

                    users.id as user_id, users.name as user_name, users.email as user_email, 
                    users.bio as user_bio, users.location as user_location, users.institution as user_institution, 
                    users.initial_reputation as "user_initialReputation", users.reputation as user_reputation, 
                    users.created_date as "user_createdDate", users.updated_date as "user_updatedDate",

                    user_field_reputation.reputation as field_reputation,

                    fields.id as field_id, fields.name as field_name, fields.description as field_description, 
                    fields.type as field_type, fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate"

                FROM users
                LEFT OUTER JOIN user_field_reputation on users.id = user_field_reputation.user_id
                LEFT OUTER JOIN fields on fields.id = user_field_reputation.field_id
                ${where} 
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return [] 
        } else {
            return this.hydrateUsers(results.rows)
        }
    }

    async insertUser(user) {
        const results = await this.database.query(`
                    INSERT INTO users (name, email, institution, password, created_date, updated_date) 
                        VALUES ($1, $2, $3, $4, now(), now()) 
                        RETURNING id

                `, 
            [ user.name, user.email, user.institution, user.password ]
        )

        if ( results.rowCount == 0 ) {
            throw new DAOError('insertion-failure', `Attempt to insert new user(${user.name}) failed.`)
        }
        return results.rows[0].id
    }

    async updatePartialUser(user) {
        let sql = 'UPDATE users SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'blindId', 'initialReputation', 'reputation', 'createdDate', 'updatedDate', 'fields']
        for(let key in user) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'orcidId') {
                sql += `orcid_id = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }

            params.push(user[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(user.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failure', `Attempt to update user(${user.id}) failed!`)
        }
    }
}
