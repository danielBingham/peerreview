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
            const results = await this.database.query('select * from root.users');
            results.rows.forEach(function(user) {
                delete user.password;
            });
            response.status(200).json(results.rows);

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
                'SELECT id, email FROM root.users WHERE email=$1',
                [ user.email ]
            );

            if (userExistsResults.rowCount > 0) {
                return response.status(409).json({error: 'user-exists'});
            }

            user.password = this.auth.hashPassword(user.password);

            const results = await this.database.query(
                'INSERT INTO users (name, email, password, created_date, updated_date) VALUES ($1, $2, $3, now(), now()) RETURNING id', 
                [ user.name, user.email, user.password ]
            );
            return response.status(201).json({
                id: results.rows[0].id
            });
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
    getUser(request, response) {
       this.database.query(
            'select * from users where id=? limit 1', 
            [request.params.id], 
            function(error, results, fields) {
                if ( error ) {
                    console.log(error);
                    response.status(500).send();
                } else {
                    let user = results[0];
                    delete user.password;

                    response.status(200).json(user);
                }
            }
        );
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     */
    async putUser(request, response) {
        const user = request.body;
        user.password = await this.auth.hashPassword(user.password);

        this.database.query(
            'update users set name = ? and email = ? and password = ? and updated_date = now() where id = ?',
            [ user.name, user.email, user.password, request.params.id ],
            function(error, results, fields) {
                if ( error ) {
                    console.log(error);
                    response.status(500).send();
                } else {
                    response.status(200).send();
                }
            }
        );
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user given a partial set of fields in JSON.
     */
    async patchUser(request, response) {
        let user = request.body;
        delete user.id;

        let sql = 'update users set ';
        let params = [];
        for(let key in user) {
            sql += key + ' = ? and ';

            if ( key == 'password' ) {
                user[key] = await this.auth.hashPassword(user[key]);
            }

            params.push(user[key]);
        }
        sql += 'updated_date = now() where id = ?';

        params.push(request.params.id);

        this.database.query( sql, params,
            function(error, results, fields) {
                if ( error ) {
                    console.log(error);
                    response.status(500).send();
                } else {
                    response.status(200).send();
                }
            }
        );
    }

    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     */
    deleteUser(request, response) {
       this.database.query(
            'delete from users where id = ?',
            [ request.params.id ],
            function(error, results, fields) {
                if ( error ) {
                    console.log(error);
                    response.status(500).send();
                } else {
                    response.status(200).send();
                }
            }
        );
    }
}; 
