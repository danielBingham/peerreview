/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/

const AuthenticationService = require('../services/authentication');

module.exports = class UserController {

    constructor(database) {
        this.database = database;
        this.auth = new AuthenticationService();
    }

    /**
     * GET /users
     *
     * Return a JSON array of all users in thethis.database.
     */
    async getUsers(request, response) {
        try {
            const results = await this.database.query(`
                select id, name, email, created_date as "createdDate", updated_date as "updatedDate" from users
            `);
            return response.status(200).json(results.rows);

        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'unknown' });
            return;
        }
    }

    /**
     * POST /users
     *
     * Create a new user in the this.database from the provided JSON.
     */
    async postUsers(request, response) {
        const user = request.body;

        // If a user already exists with that email, send a 409 Conflict
        // response.
        //
        try {
            const userExistsResults = await this.database.query(
                'SELECT id, email FROM users WHERE email=$1',
                [ user.email ]
            );

            if (userExistsResults.rowCount > 0) {
                return response.status(409).json({error: 'user-exists'});
            }

            user.password = this.auth.hashPassword(user.password);

            const results = await this.database.query(`
                    INSERT INTO users (name, email, password, created_date, updated_date) 
                        VALUES ($1, $2, $3, now(), now()) 
                        RETURNING id, name, email, created_date as "createdDate", updated_date as "updatedDate" 

                `, 
                [ user.name, user.email, user.password ]
            );
            return response.status(201).json(results.rows[0]);
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     */
    async getUser(request, response) {

        try {
           const results = await this.database.query(`
                    select id, name, email, created_date as "createdDate", updated_date as "updatedDate" from users where id=$1
               `, 
               [request.params.id] 
           );

            if (results.rowCount == 0) {
                return response.status(404).json({});
            }

            return response.status(200).json(results.rows[0]);
        } catch (error) {
            console.error(error);
            return response.status(500).send();
        }
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     */
    async putUser(request, response) {
        try {
            const user = request.body;
            user.password = this.auth.hashPassword(user.password);

            const results = await this.database.query(`
                    UPDATE users SET name = $1 AND email = $2 AND password = $3 AND updated_date = now() 
                        WHERE id = $4 
                        RETURNING id, name, email, created_date as "createdDate", updated_date as "updatedDate" 
                `,
                [ user.name, user.email, user.password, request.params.id ]
            );

            if (results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json(results.rows[0]);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user given a partial set of fields in JSON.
     */
    async patchUser(request, response) {
        let user = request.body;
        delete user.id;

        let sql = 'UPDATE users SET ';
        let params = [];
        let count = 1;
        for(let key in user) {
            sql += key + ' = $' + count + ' and ';

            if ( key == 'password' ) {
                try {
                    user[key] = await this.auth.hashPassword(user[key]);
                } catch (error) {
                    console.error(error);
                    return response.status(500).json({error: 'unknown'});
                }
            }

            params.push(user[key]);
            count = count + 1;
        }
        sql += 'updated_date = now() WHERE id = $' + count;
        sql += ' RETURNING id, name, email, created_date as "createdDate", updated_date as "updatedDate"';

        params.push(request.params.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json(results.rows[0]);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     */
    async deleteUser(request, response) {

        try {
            const results = await this.database.query(
                'delete from users where id = $1',
                [ request.params.id ]
            );

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json({userId: request.params.id});
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }
}; 
