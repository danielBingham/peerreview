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
module.exports = function(database, logger, config) {
    const express = require('express')
    const multer = require('multer')

    const ControllerError = require('./errors/ControllerError')
    const router = express.Router()

    /******************************************************************************
     *          File REST Routes
     ******************************************************************************/
    const FileController = require('./controllers/files')
    const fileController = new FileController(database, logger)

    const upload = new multer({ dest: 'public/uploads/tmp' })

    // Upload a version of the paper.
    router.post('/upload', upload.single('file'), function(request, response) {
        fileController.upload(request, response)
    })

    router.delete('/file/:id', function(request, response) {
        fileController.deleteFile(request, response)
    })

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/
    const UserController = require('./controllers/users')
    const userController = new UserController(database, logger)

    // Get a list of all users.
    router.get('/users', function(request, response) {
        userController.getUsers(request, response)
    })

    // Create a new user 
    router.post('/users', function(request, response) {
        userController.postUsers(request, response)
    })

    // Get the details of a single user 
    router.get('/user/:id', function(request, response) {
        userController.getUser(request, response)
    })

    // Replace a user wholesale.
    router.put('/user/:id', function(request, response) {
        userController.putUser(request, response)
    })

    // Edit an existing user with partial data.
    router.patch('/user/:id', function(request, response) {
        userController.patchUser(request, response)
    })

    // Delete an existing user.
    router.delete('/user/:id', function(request, response) {
        userController.deleteUser(request, response)
    })

    /******************************************************************************
     *          User Settings REST Routes
     ******************************************************************************/
    const SettingsController = require('./controllers/settings')
    const settingsController = new SettingsController(database, logger)

    // Get a list of all settings.
    router.get('/user/:user_id/settings', function(request, response) {
        settingsController.getSettings(request, response)
    })

    // Create a new setting 
    router.post('/user/:user_id/settings', function(request, response) {
        settingsController.postSettings(request, response)
    })

    // When we don't have a use, just store settings on the session.
    router.post('/settings', function(request, response) {
        settingsController.postSettings(request, response)
    })

    // Get the details of a single setting 
    router.get('/user/:user_id/setting/:id', function(request, response) {
        settingsController.getSetting(request, response)
    })

    // Replace a setting wholesale.
    router.put('/user/:user_id/setting/:id', function(request, response) {
        settingsController.putSetting(request, response)
    })

    // Edit an existing setting with partial data.
    router.patch('/user/:user_id/setting/:id', function(request, response) {
        settingsController.patchSetting(request, response)
    })

    // Delete an existing setting.
    router.delete('/user/:user_id/setting/:id', function(request, response) {
        settingsController.deleteSetting(request, response)
    })


    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    const AuthenticationController = require('./controllers/authentication')
    const authenticationController = new AuthenticationController(database, logger)

    router.post('/authentication', function(request, response) {
        authenticationController.postAuthentication(request, response)
    })

    router.patch('/authentication', function(request, response) {
        authenticationController.patchAuthentication(request, response)
    })

    router.get('/authentication', function(request, response) {
        authenticationController.getAuthentication(request,response)
    })

    router.delete('/authentication', function(request, response) {
        authenticationController.deleteAuthentication(request, response)
    })

    /******************************************************************************
     *          Field REST Routes
     ******************************************************************************/

    const FieldController = require('./controllers/fields')
    const fieldController = new FieldController(database)

    // Get a list of all fields.
    router.get('/fields', function(request, response, next) {
        fieldController.getFields(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new field 
    router.post('/fields', function(request, response, next) {
        fieldController.postFields(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single field 
    router.get('/field/:id', function(request, response, next) {
        fieldController.getField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Replace a field wholesale.
    router.put('/field/:id', function(request, response) {
        return response.status(501).json({ error: 'unimplemented' })
        //fieldController.putField(request, response)
    })

    // Edit an existing field with partial data.
    router.patch('/field/:id', function(request, response) {
        return response.status(501).send()
        //fieldController.patchField(request, response)
    })

    // Delete an existing field.
    router.delete('/field/:id', function(request, response) {
        fieldController.deleteField(request, response)
    })

    /******************************************************************************
     *          Paper REST Routes
     ******************************************************************************/

    const PaperController = require('./controllers/papers')
    const paperController = new PaperController(database, logger)

    // Get a list of all papers.
    router.get('/papers', function(request, response, next) {
        paperController.getPapers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new paper 
    router.post('/papers', function(request, response) {
        paperController.postPapers(request, response)
    })

    // Get the details of a single paper 
    router.get('/paper/:id', function(request, response) {
        paperController.getPaper(request, response)
    })

    // Replace a paper wholesale.
    router.put('/paper/:id', function(request, response) {
        paperController.putPaper(request, response)
    })

    // Edit an existing paper with partial data.
    router.patch('/paper/:id', function(request, response) {
        paperController.patchPaper(request, response)
    })

    // Delete an existing paper.
    router.delete('/paper/:id', function(request, response) {
        paperController.deletePaper(request, response)
    })

    /******************************************************************************
     *          Version REST Routes
     ******************************************************************************/

    router.post('/paper/:id/versions', function(request, response) {
        paperController.postPaperVersions(request, response)
    })

    router.patch('/paper/:paper_id/version/:version', function(request, response) {
        paperController.patchPaperVersion(request, response)
    })

    /**************************************************************************
     *      Paper Review REST Routes
     *************************************************************************/

    const ReviewController = require('./controllers/reviews')
    const reviewController = new ReviewController(database)

    router.get('/paper/:paper_id/reviews', function(request, response) {
        reviewController.getReviews(request, response)
    })

    router.post('/paper/:paper_id/reviews', function(request, response) {
        reviewController.postReviews(request, response)
    })

    router.get('/paper/:paper_id/review/:id', function(request, response) {
        reviewController.getReview(request, response)
    })

    router.put('/paper/:paper_id/review/:id', function(request, response) {
        reviewController.putReview(request, response)
    })

    router.patch('/paper/:paper_id/review/:id', function(request, response) {
        reviewController.patchReview(request, response)
    })

    router.delete('/paper/:paper_id/review/:id', function(request, response) {
        reviewController.deleteReview(request, response)
    })

    router.post('/paper/:paper_id/review/:review_id/threads', function(request, response) {
        reviewController.postThreads(request, response)
    })

    router.delete('/paper/:paper_id/review/:review_id/thread/:thread_id', function(request, response) {
        reviewController.deleteThread(request,response)
    })

    router.post('/paper/:paper_id/review/:review_id/thread/:thread_id/comments', function(request, response) {
        reviewController.postComments(request, response)
    })

    router.patch('/paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id', function(request, response) {
        reviewController.patchComment(request, response)
    })

    router.delete('/paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id', function(request, response) {
        reviewController.deleteComment(request, response)
    })

    /**************************************************************************
     *  Vote REST Routes
     */
    const VoteController = require('./controllers/votes.js')
    const voteController = new VoteController(database, logger)

    // Get a list of all votes on a paper.
    router.get('/paper/:paper_id/votes', function(request, response) {
        voteController.getVotes(request, response)
    })

    // Create a new vote on a paper 
    router.post('/paper/:paper_id/votes', function(request, response) {
        voteController.postVotes(request, response)
    })

    // Get the details of a single vote on a paper 
    router.get('/paper/:paper_id/user/:user_id/vote', function(request, response) {
        voteController.getVote(request, response)
    })

    // Replace a vote on a paper.
    router.put('/paper/:paper_id/user/:user_id/vote', function(request, response) {
        voteController.putVote(request, response)
    })

    // Edit an existing paper with partial data.
    router.patch('/paper/:paper_id/user/:user_id/vote', function(request, response) {
        return response.status(501).json({ error: 'not-implemented' })
    })

    // Delete an existing paper.
    router.delete('/paper/:paper_id/user/:user_id/vote', function(request, response) {
        voteController.deleteVote(request, response)
    })

    /**************************************************************************
     *      Paper Response REST Routes
     *************************************************************************/

    const ResponseController = require('./controllers/responses')
    const responseController = new ResponseController(database)

    router.get('/paper/:paper_id/responses', function(request, response, next) {
        responseController.getResponses(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/paper/:paper_id/responses', function(request, response, next) {
        responseController.postResponses(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/paper/:paper_id/response/:id', function(request, response, next) {
        responseController.getResponse(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/paper/:paper_id/response/:id', function(request, response, next) {
        responseController.putResponse(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/paper/:paper_id/response/:id', function(request, response, next) {
        responseController.patchResponse(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/paper/:paper_id/response/:id', function(request, response, next) {
        responseController.deleteResponse(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      API 404 
     *************************************************************************/

    router.use('*', function(request, response) {
        throw new ControllerError(404, 'no-resource', `Request for non-existent resource ${request.originalUrl}.`)
    })

    return router
}


