/**************************************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.
 * For now, all of the routes and their implementations are defined in this
 * file.  
 *
 * @version: 0.0.0
 *
 * NOTE: This file is versioned and loaded on ``/api/0.0.0/``.  So ``/users`` is
 * really ``/api/0.0.0/users``.  This is so that we can load multiple versions
 * of the api as we make changes and leave past versions still accessible.
 *
 * @TODO: For now keeping the route's implementations in this file is perfectly
 * managable.  However, this file will eventually get too big.  Choose either
 * the Controller pattern or the Action pattern to break the route's
 * implementations out into their own files in the future.
 *
 **************************************************************************************************/
var version = '0.0.0';

var express = require('express');
var router = express.Router();

var config = require('./config');

module.exports = function(database) {

    //  Return the API's current version.
    router.get('/version', function(request, response) {
        response.json({version: version});
    });

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/

    // Get a list of all users.
    router.get('/users', function(request, response) {
        database.query(
            'select * from users', 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json(results); 
            }
        );
    });

    // Create a new user 
    // TODO hash the password properly
    router.post('/users', function(request, response) {
        const user = request.body;
        database.query(
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
    });

    // Get the details of a single user 
    router.get('/user/:id', function(request, response) {
        database.query(
            'select * from users where id=?', 
            [request.params.id], 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json(results);
            }
        );
    });

    // Replace a user wholesale.
    // TODO hash the password properly
    router.put('/users/:id', function(request, response) {
        const user = request.body;
        database.query(
            'udpate users set name = ? and email = ? and password = ? and updated_date = now() where id = ?',
            [ user.name, user.email, user.password, user.id ],
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json({ success: true });
            }
        );
    });
        
    // Edit an existing user with partial data.
    // TODO secure password hashing
    router.patch('/users/:id', function(request, response) {
        const user = request.body;

        let sql = 'update users set ';
        let params = [];
        for(let key in user) {
            sql += key + ' = ? and ';
            params.push(user[key]);
        }
        sql += 'updated_date = now() where id = ?';

        database.query( sql, params,
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json({success: true});
            }
        );
    });

    // Delete an existing user.
    router.delete('/users/:id', function(request, response) {
        database.query(
            'delete from recipes where id = ?',
            [ request.params.id ],
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json({success: true});
            }
        );
    });

    return router;
};
