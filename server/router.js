/**************************************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.
 * For now, all of the routes and their implementations are defined in this
 * file.  
 *
 * NOTE: This file is versioned and loaded on ``/api/0.0.0/``.  So ``/users`` is
 * really ``/api/0.0.0/users``.  This is so that we can load multiple versions
 * of the api as we make changes and leave past versions still accessible.
 **************************************************************************************************/
const express = require('express');

module.exports = function(database, config) {
    const router = express.Router();

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/
    const UserController = require('./controllers/users');
    const userController = new UserController(database);

    // Get a list of all users.
    router.get('/users', function(request, response) {
        userController.getUsers(request, response);
    });

    // Create a new user 
    router.post('/users', function(request, response) {
        userController.postUsers(request, response);
    });

    // Get the details of a single user 
    router.get('/user/:id', function(request, response) {
        userController.getUser(request, response);
    });

    // Replace a user wholesale.
    router.put('/users/:id', function(request, response) {
        userController.putUser(request, response);
    });
        
    // Edit an existing user with partial data.
    router.patch('/users/:id', function(request, response) {
        userController.patchUser(request, response);
    });

    // Delete an existing user.
    router.delete('/users/:id', function(request, response) {
        userController.deleteUser(request, response);
    });

    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    const AuthenticationController = require('./controllers/authentication');
    const authenticationController = new AuthenticationController(database);

    router.post('/authenticate', function(request, response) {
        authenticationController.authenticate(request, response);
    });

    router.get('/authenticate', function(request, response) {
        authenticationController.getAuthenticated(request,response);
    });

    router.get('/logout', function(request, response) {
        authenticationController.logout(request, response);
    });

    return router;
};
