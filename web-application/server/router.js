/**************************************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.
 *
 * NOTE: This file is versioned and loaded on ``/api/0.0.0/``.  So ``/users`` is
 * really ``/api/0.0.0/users``.  This is so that we can load multiple versions
 * of the api as we make changes and leave past versions still accessible.
 **************************************************************************************************/
module.exports = function(database, logger, config) {
    const express = require('express')
    const multer = require('multer')
    const backend = require('@danielbingham/peerreview-backend')

    const ControllerError = require('./errors/ControllerError')

    const router = express.Router()

    /******************************************************************************
     * Feature Flag Management and Migration Rest Routes
     *****************************************************************************/
    const FeatureController = require('./controllers/FeatureController')
    const featureController = new FeatureController(database, logger, config)

    router.get('/features', function(request, response, next) {
        featureController.getFeatures(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/features', function(request, response, next) {
        featureController.postFeatures(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/feature/:name', function(request, response, next) {
        featureController.getFeature(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/feature/:name', function(request, response, next) {
        featureController.patchFeature(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          File REST Routes
     ******************************************************************************/
    const FileController = require('./controllers/FileController')
    const fileController = new FileController(database, logger, config)

    const upload = new multer({ dest: 'public/uploads/tmp' })

    // Upload a version of the paper.
    router.post('/upload', upload.single('file'), function(request, response, next) {
        fileController.upload(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/file/:id', function(request, response, next) {
        fileController.deleteFile(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/
    const UserController = require('./controllers/UserController')
    const userController = new UserController(database, logger, config)

    // Get a list of all users.
    router.get('/users', function(request, response, next) {
        userController.getUsers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new user 
    router.post('/users', function(request, response, next) {
        userController.postUsers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single user 
    router.get('/user/:id', function(request, response, next) {
        userController.getUser(request, response).catch(function(error) {
            next(error)
        })
    })

    // Replace a user wholesale.
    router.put('/user/:id', function(request, response, next) {
        userController.putUser(request, response).catch(function(error) {
            next(error)
        })
    })

    // Edit an existing user with partial data.
    router.patch('/user/:id', function(request, response, next) {
        return userController.patchUser(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing user.
    router.delete('/user/:id', function(request, response, next) {
        return userController.deleteUser(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *  Reputation Routes 
     **************************************************************************/

    const ReputationController = require('./controllers/ReputationController')
    const reputationController = new ReputationController(database, logger)

    router.get('/reputation/thresholds', function(request, response, next) {
        reputationController.getReputationThresholds(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/user/:user_id/reputation/initialization', function(request, response, next) {
        return reputationController.initializeReputation(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/user/:user_id/reputations', function(request, response, next) {
        return reputationController.getReputations(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/user/:id/reputations', function(request, response) {
        return response.status(501).send()
    })

    router.get('/user/:user_id/reputation/:field_id', function(request, response, next) {
        return reputationController.getReputation(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/user/:id/reputation/:field_id', function(request, response) {
        return response.status(501).send()
    })

    router.patch('/user/:id/reputation/:field_id', function(request, response) {
        return response.status(501).send()
    })

    router.delete('/user/:id/reputation/:field_id', function(request, response) {
        return response.status(501).send()
    })

    /****************************************************************
     * Reputation Administration Methods
     ****************************************************************/

    // NOTE: These are here for testing and development purposes only.
    // TODO Remove before we go to production.  (Or formalize into a
    // admin/development interface only loaded on development and staging
    // environments.)
    const reputationService = new backend.ReputationGenerationService(database, logger)
    router.get('/user/:id/initialize-reputation/orcid/:orcidId', function(request, response, next) {
        reputationService.initializeReputationForUserWithOrcidId(request.params.id, request.params.orcidId).then(function() {
            return response.status(200).send()
        }).catch(function(error) {
            next(error)
        })
    })

    router.get('/user/:id/initialize-reputation/openalex/:openAlexId', function(request, response, next) {
        reputationService.initializeReputationForUserWithOpenAlexId(request.params.id, request.params.openAlexId).then(function() {
            return response.status(200).send()
        }).catch(function(error) {
            next(error)
        })
    })

    router.get('/user/:id/recalculate-reputation', function(request, response, next) {
        reputationService.recalculateReputationForUser(request.params.id).then(function() {
            return response.status(200).send()
        }).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          User Settings REST Routes
     ******************************************************************************/
    const SettingsController = require('./controllers/SettingsController')
    const settingsController = new SettingsController(database, logger, config)

    // Get a list of all settings.
    router.get('/user/:user_id/settings', function(request, response, next) {
        settingsController.getSettings(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new setting 
    router.post('/user/:user_id/settings', function(request, response, next) {
        settingsController.postSettings(request, response).catch(function(error) {
            next(error)
        })
    })

    // When we don't have a use, just store settings on the session.
    router.post('/settings', function(request, response, next) {
        settingsController.postSettings(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single setting 
    router.get('/user/:user_id/setting/:id', function(request, response, next) {
        settingsController.getSetting(request, response).catch(function(error) {
            next(error)
        })
    })

    // Replace a setting wholesale.
    router.put('/user/:user_id/setting/:id', function(request, response, next) {
        settingsController.putSetting(request, response).catch(function(error) {
            next(error)
        })
    })

    // Edit an existing setting with partial data.
    router.patch('/user/:user_id/setting/:id', function(request, response, next) {
        settingsController.patchSetting(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing setting.
    router.delete('/user/:user_id/setting/:id', function(request, response, next) {
        settingsController.deleteSetting(request, response).catch(function(error) {
            next(error)
        })
    })


    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    const AuthenticationController = require('./controllers/AuthenticationController')
    const authenticationController = new AuthenticationController(database, logger, config)

    router.post('/authentication', function(request, response, next) {
        authenticationController.postAuthentication(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/authentication', function(request, response, next) {
        authenticationController.patchAuthentication(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/authentication', function(request, response, next) {
        authenticationController.getAuthentication(request,response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/authentication', function(request, response) {
        // Delete isn't async
        authenticationController.deleteAuthentication(request, response)
    })
    
    router.post('/orcid/authentication', function(request, response, next) {
        authenticationController.postOrcidAuthentication(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Token Handling REST Routes
     * ************************************************************************/
    const TokenController = require('./controllers/TokenController')
    const tokenController = new TokenController(database, logger, config)

    router.get('/token/:token', function(request, response, next) {
        tokenController.getToken(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/tokens', function(request, response, next) {
        tokenController.postToken(request, response).catch(function(error) {
            next(error)
        })
    })


    /******************************************************************************
     *          Field REST Routes
     ******************************************************************************/

    const FieldController = require('./controllers/FieldController')
    const fieldController = new FieldController(database, logger)

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
    router.put('/field/:id', function(request, response, next) {
        fieldController.putField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Edit an existing field with partial data.
    router.patch('/field/:id', function(request, response, next) {
        fieldController.patchField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing field.
    router.delete('/field/:id', function(request, response, next) {
        fieldController.deleteField(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          Paper REST Routes
     ******************************************************************************/

    const PaperController = require('./controllers/PaperController')
    const paperController = new PaperController(database, logger, config)
    
    router.get('/papers/count', function(request, response, next) {
        paperController.countPapers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get a list of all papers.
    router.get('/papers', function(request, response, next) {
        paperController.getPapers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new paper 
    router.post('/papers', function(request, response, next) {
        paperController.postPapers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single paper 
    router.get('/paper/:id', function(request, response, next) {
        paperController.getPaper(request, response).catch(function(error) {
            next(error)
        })
    })

    // Replace a paper wholesale.
    router.put('/paper/:id', function(request, response, next) {
        paperController.putPaper(request, response).catch(function(error) {
            next(error)
        })

    })

    // Edit an existing paper with partial data.
    router.patch('/paper/:id', function(request, response, next) {
        paperController.patchPaper(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing paper.
    router.delete('/paper/:id', function(request, response, next) {
        paperController.deletePaper(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          Version REST Routes
     ******************************************************************************/

    router.post('/paper/:paper_id/versions', function(request, response, next) {
        paperController.postPaperVersions(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/paper/:paper_id/version/:version', function(request, response, next) {
        paperController.patchPaperVersion(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Paper Review REST Routes
     *************************************************************************/

    const ReviewController = require('./controllers/ReviewController')
    const reviewController = new ReviewController(database, logger)

    router.get('/reviews/count', function(request, response, next) {
        reviewController.countReviews(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/paper/:paper_id/reviews', function(request, response, next) {
        reviewController.getReviews(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/paper/:paper_id/reviews', function(request, response, next) {
        reviewController.postReviews(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/paper/:paper_id/review/:review_id', function(request, response, next) {
        reviewController.getReview(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/paper/:paper_id/review/:review_id', function(request, response, next) {
        throw new ControllerError(501, 'not-implemented', 'PUT /paper/:paper_id/review/:review_id is intentionally unimplemented.')
        /*reviewController.putReview(request, response).catch(function(error) {
            next(error)
        })*/
    })

    router.patch('/paper/:paper_id/review/:review_id', function(request, response, next) {
        reviewController.patchReview(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/paper/:paper_id/review/:review_id', function(request, response, next) {
        reviewController.deleteReview(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/paper/:paper_id/review/:review_id/threads', function(request, response, next) {
        reviewController.postThreads(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/paper/:paper_id/review/:review_id/thread/:thread_id', function(request, response, next) {
        reviewController.deleteThread(request,response).catch(function(error) {
            next(error)
        })
    })

    router.post('/paper/:paper_id/review/:review_id/thread/:thread_id/comments', function(request, response, next) {
        reviewController.postComments(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id', function(request, response, next) {
        reviewController.patchComment(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id', function(request, response, next) {
        reviewController.deleteComment(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Paper Response REST Routes
     *************************************************************************/

    const ResponseController = require('./controllers/ResponseController')
    const responseController = new ResponseController(database, logger, config)

    router.get('/responses/count', function(request, response, next) {
        responseController.countResponses(request, response).catch(function(error) {
            next(error)
        })
    })

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
        throw new ControllerError(501, 'not-implemented', `PUT Response is not implemented.`)
        /*responseController.putResponse(request, response).catch(function(error) {
            next(error)
        })*/
    })

    router.patch('/paper/:paper_id/response/:id', function(request, response, next) {
        throw new ControllerError(501, 'not-implemented', `PATCH Response is not implemented.`)
        /*responseController.patchResponse(request, response).catch(function(error) {
            next(error)
        })*/
    })

    router.delete('/paper/:paper_id/response/:id', function(request, response, next) {
        throw new ControllerError(501, 'not-implemented', `DELETE Response is not implemented.`)
        /*responseController.deleteResponse(request, response).catch(function(error) {
            next(error)
        })*/
    })

    /**************************************************************************
     *      API 404 
     *************************************************************************/

    router.use('*', function(request, response) {
        throw new ControllerError(404, 'no-resource', `Request for non-existent resource ${request.originalUrl}.`)
    })

    return router
}

