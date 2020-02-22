/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/

module.exports = class UserController {

    constructor(database) {
        this.database = database;
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
    postUsers(request, response) {
        const user = request.body;
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
            'select * from users where id=?', 
            [request.params.id], 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json(results);
            }
        );
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     */
    putUser(request, response) {
        const user = request.body;
       this.database.query(
            'udpate users set name = ? and email = ? and password = ? and updated_date = now() where id = ?',
            [ user.name, user.email, user.password, user.id ],
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
    patchUser(request, response) {
        const user = request.body;

        let sql = 'update users set ';
        let params = [];
        for(let key in user) {
            sql += key + ' = ? and ';
            params.push(user[key]);
        }
        sql += 'updated_date = now() where id = ?';

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
            'delete from recipes where id = ?',
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
