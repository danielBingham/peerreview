/**************************************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.  For now, all of
 * the routes and their implementations are defined in this file.  
 *
 * @version: 0.0.0
 *
 * NOTE: This file is versioned and loaded on ``/api/v0/``.  So ``/recipes`` is really
 * ``/api/v0/recipes``.  This is so that we can load multiple versions of the api as we make changes
 * and leave past versions still accessible.
 *
 * @TODO: For now keeping the route's implementations in this file is perfectly managable.  However,
 * this file will eventually get too big.  Choose either the Controller pattern or the Action
 * pattern to break the route's implementations out into their own files in the future.
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
     *          Recipe REST Routes
     ******************************************************************************/

    // Get a list of all recipes.
    router.get('/recipes', function(request, response) {
        database.query(
            'select * from recipes', 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json(results); 
            }
        );
    });

    // Create a new recipe
    router.post('/recipes', function(request, response) {
        var recipe = request.body;
        database.query(
            'insert into recipes (title, source_url, created_date, update_date) values (?, ?, now(), now())', 
            [recipe.title, recipe.source_url], 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                recipe.id = results.insertId;
                response.json(recipe);
            }
        );
    });

    // Get the details of a single recipe
    router.get('/recipes/:id', function(request, response) {
        database.query(
            'select * from recipes where id=?', 
            [request.params.id], 
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json(results);
            }
        );
    });

    // Edit an existing recipe.
    router.post('/recipes/:id', function(request, response) {
        database.query(
            'update recipes set title = ? and source_url = ? where id = ?', 
            [request.params.title, request.params.source_url, request.params.id],
            function(error, results, fields) {
                if ( error ) {
                    throw error;
                }
                response.json({success: true});
            }
        );

    });

    // Delete an existing recipe.
    router.delete('/recipes/:id', function(request, response) {
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
