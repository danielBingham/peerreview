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
const multer = require('multer');

module.exports = function(database, config) {
    const router = express.Router();

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/
    const UserController = require('./controllers/users');
    const userController = new UserController(database);

    // Run a query against users
    router.get('/users/query', function(request, response) {
        userController.queryUsers(request, response);
    });

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
    router.put('/user/:id', function(request, response) {
        userController.putUser(request, response);
    });
        
    // Edit an existing user with partial data.
    router.patch('/user/:id', function(request, response) {
        userController.patchUser(request, response);
    });

    // Delete an existing user.
    router.delete('/user/:id', function(request, response) {
        userController.deleteUser(request, response);
    });

    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    const AuthenticationController = require('./controllers/authentication');
    const authenticationController = new AuthenticationController(database);

    router.post('/authentication', function(request, response) {
        authenticationController.postAuthentication(request, response);
    });

    router.get('/authentication', function(request, response) {
        authenticationController.getAuthentication(request,response);
    });

    router.delete('/authentication', function(request, response) {
        authenticationController.deleteAuthentication(request, response);
    });

    /******************************************************************************
     *          Paper REST Routes
     ******************************************************************************/

    const PaperController = require('./controllers/papers');
    const paperController = new PaperController(database);

    const upload = new multer({ dest: 'public/uploads/tmp' });


    // Get a list of all papers.
    router.get('/papers', function(request, response) {
        paperController.getPapers(request, response);
    });

    // Create a new paper 
    router.post('/papers', function(request, response) {
        paperController.postPapers(request, response);
    });

    // Upload a version of the paper.
    router.post('/paper/:id/upload', upload.single('paperVersion'), function(request, response) {
        paperController.uploadPaper(request, response);
    });

    // Get the details of a single paper 
    router.get('/paper/:id', function(request, response) {
        paperController.getPaper(request, response);
    });

    // Replace a paper wholesale.
    router.put('/paper/:id', function(request, response) {
        return response.status(501);
        //paperController.putPaper(request, response);
    });
        
    // Edit an existing paper with partial data.
    router.patch('/paper/:id', function(request, response) {
        return response.status(501);
        //paperController.patchPaper(request, response);
    });

    // Delete an existing paper.
    router.delete('/paper/:id', function(request, response) {
        paperController.deletePaper(request, response);
    });
    return router;
};
