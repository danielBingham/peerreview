const DAOError = require('../errors/DAOError')
const FileDAO = require('./files')

const PAGE_SIZE = 20

module.exports = class UserDAO {


    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fileDAO = new FileDAO(database, logger)

        this.selectionString = `
            users.id as user_id, users.orcid_id as "user_orcidId", users.file_id as "user_fileId",
            users.status as user_status, users.permissions as user_permissions,
            users.name as user_name, users.email as user_email, 
            users.bio as user_bio, users.location as user_location, users.institution as user_institution, 
            users.reputation as user_reputation, 
            users.created_date as "user_createdDate", users.updated_date as "user_updatedDate"
        `

        this.cleanSelectionString = `
            users.id as user_id, users.orcid_id as "user_orcidId", users.file_id as "user_fileId",
            users.name as user_name,
            users.bio as user_bio, users.location as user_location, users.institution as user_institution, 
            users.reputation as user_reputation, 
            users.created_date as "user_createdDate", users.updated_date as "user_updatedDate"
        `
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows, clean) {
        if ( rows.length == 0 ) {
            return [] 
        }

        const users = {}
        const list = []

        for( const row of rows ) {
            const user = {
                id: ( row.user_id !== undefined ? row.user_id : null),
                orcidId: ( row.user_orcidId !== undefined ? row.user_orcidId : null),
                name: ( row.user_name !== undefined ? row.user_name : null),
                bio: ( row.user_bio !== undefined ? row.user_bio : null),
                location: ( row.user_location !== undefined ? row.user_location : null), 
                institution: ( row.user_institution !== undefined ? row.user_institution : null), 
                reputation: ( row.user_reputation !== undefined ? row.user_reputation : null),
                createdDate: ( row.user_createdDate !== undefined ? row.user_createdDate : null),
                updatedDate: ( row.user_updatedDate !== undefined ? row.user_updatedDate : null)
            }

            if ( ! clean ) {
                // Issue #132 - We don't want to expose the user's email.
                user.email = ( row.user_email !== undefined ? row.user_email : null)
                user.status = ( row.user_status !== undefined ? row.user_status : null)
                user.permissions = ( row.user_permissions !== undefined ? row.user_permissions : null)
            }

            if ( row.file_id ) {
                user.file = this.fileDAO.hydrateFile(row)
            } else {
                user.file = null
            }

            if ( ! users[row.user_id] ) {
                users[user.id] = user
                list.push(user)
            }
        }

        return list 
    }

    /**
     * Get users with any sensitive data cleaned out of the record.  This
     * method should be used any time we plan to return the users from the
     * backend.
     *
     * @see this.selectUsers()
     */
    async selectCleanUsers(where, params, order, page) {
        return await this.selectUsers(where, params, order, page, true)
    }

    /**
     * Retrieve user records from the database.
     *
     */
    async selectUsers(where, params, order, page, clean) {
        params = params ? params : []
        where = where ? where : ''
        order = order ? order : 'users.created_date desc'

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
                    ${ clean === true ? this.cleanSelectionString : this.selectionString},
                    ${this.fileDAO.getFilesSelectionString()}
                FROM users
                    LEFT OUTER JOIN files ON files.id = users.file_id
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydrateUsers(results.rows, (clean === true))
    }

    async countUsers(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                 COUNT(users.id) as count
                FROM users 
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

    async insertUser(user) {
        if ( ! user.name ) {
            throw new DAOError('name-missing', `Attempt to create a user with out a name.`)
        }

        if ( ! user.email ) {
            throw new DAOError('email-missing', `Attempt to create a user without an email.`)
        }

        user.status = user.status ? user.status : 'unconfirmed'
        user.password = user.password ? user.password : null
        user.institution = user.institution ? user.institution : null

        const results = await this.database.query(`
                    INSERT INTO users (name, email, status, institution, password, created_date, updated_date) 
                        VALUES ($1, $2, $3, $4, $5, now(), now()) 
                        RETURNING id

                `, 
            [ user.name, user.email, user.status, user.institution, user.password ]
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
        const ignored = [ 'id', 'blindId', 'reputation', 'createdDate', 'updatedDate', 'fields']
        for(let key in user) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'orcidId') {
                sql += `orcid_id = $${count}, `
            } else if ( key == 'fileId' ) {
                sql += `file_id = $${count}, `
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
