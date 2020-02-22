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
    getUsers(request, response) {
       this.database.query(
            'select * from users', 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }

                results.forEach(function(user) {
                    delete user.password;
                });

                response.json(results); 
            }
        );
    }

    /**
     * POST /users
     *
     * Create a new user in thethis.database from the provided JSON.
     */
    async postUsers(request, response) {
        const user = request.body;
        user.password = await this.auth.hashPassword(user.password);

        this.database.query(
            'insert into users (name, email, password, created_date, updated_date) values (?, ?, ?, now(), now())', 
            [ user.name, user.email, user.password ], 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                delete user.password;
                user.id = results.insertId;
                response.json(user);
            }
        );
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
                    throw error;
                }

                let user = results[0];
                delete user.password;

                response.json(user);
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
            'udpate users set name = ? and email = ? and password = ? and updated_date = now() where id = ?',
            [ user.name, user.email, user.password, request.params.id ],
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json({ success: true });
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
                    throw error;
                }
                response.json({success: true});
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
                    throw error;
                }
                response.json({success: true});
            }
        );
    }
}; 
