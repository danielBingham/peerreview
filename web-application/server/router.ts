/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
/*******************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.
 *
 * NOTE: This file is versioned and loaded on ``/api/0.0.0/``.  So ``/users`` is
 * really ``/api/0.0.0/users``.  This is so that we can load multiple versions
 * of the api as we make changes and leave past versions still accessible.
 *
 *******************************************************************************/
import express from 'express'

import { Core } from '@danielbingham/peerreview-core' 
import { ControllerError } from './errors/ControllerError'

import { initializeFeatureRoutes } from './routes/foundation/Feature'
import { initializeJobRoutes } from './routes/foundation/Job'
import { initializeFileRoutes } from './routes/foundation/File'

import { initializeUserRoutes } from './routes/entities/User'
import { initializeNotificationRoutes } from './routes/entities/Notification'

export function initializeAPIRouter(core: Core) {
    const router = express.Router()

    initializeFeatureRoutes(core, router)
    initializeJobRoutes(core, router)
    initializeFileRoutes(core, router)

    initializeUserRoutes(core, router)
    initializeNotificationRoutes(core, router)

    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    /**************************************************************************
     *      Token Handling REST Routes
     * ************************************************************************/
    const TokenController = require('./controllers/TokenController')
    const tokenController = new TokenController(core)

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
    const fieldController = new FieldController(core)

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
    const paperController = new PaperController(core)
    
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
     *          Paper Event Routes
     * ************************************************************************/
    const PaperEventController = require('./controllers/PaperEventController')
    const paperEventController = new PaperEventController(core)

    router.get('/paper/:paperId/events', function(request, response, next) {
        paperEventController.getEvents(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/paper/:paperId/event/:eventId', function(request, response, next) {
        paperEventController.patchEvent(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          Paper Comment Routes
     ******************************************************************************/

    const PaperCommentController = require('./controllers/PaperCommentController')
    const paperCommentController = new PaperCommentController(core)

    router.post('/paper/:paperId/comments', function(request, response, next) {
        paperCommentController.postPaperComments(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/paper/:paperId/comment/:paperCommentId', function(request, response, next) {
        paperCommentController.patchPaperComment(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/paper/:paperId/comment/:paperCommentId', function(request, response, next) {
        paperCommentController.deletePaperComment(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     * Dashboard Feeds
     * ***************************************************************************/

    router.get('/feed/editor', function(request, response, next) {
        paperEventController.getEditorFeed(request, response).catch(function(error) {
            next(error)
        })
    })


    /**************************************************************************
     * Paper Submission REST Routes
     **************************************************************************/

    router.get('/paper/:paperId/submissions', function(request, response, next) {
        paperController.getPaperSubmissions(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Paper Review REST Routes
     *************************************************************************/

    const ReviewController = require('./controllers/ReviewController')
    const reviewController = new ReviewController(core)

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
    const responseController = new ResponseController(core)

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
     *      Journal REST Routes
     *************************************************************************/

    const JournalController = require('./controllers/JournalController')
    const journalController = new JournalController(core)


    // ======= Journals =======================================================
    
    router.get('/journals', function(request, response, next) {
        journalController.getJournals(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/journals', function(request, response, next) {
        journalController.postJournals(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/journal/:id', function(request, response, next) {
        journalController.getJournal(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/journal/:id', function(request, response, next) {
        journalController.patchJournal(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/journal/:id', function(request, response, next) {
        journalController.putJournal(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/journal/:id', function(request, response, next) {
        journalController.deleteJournal(request, response).catch(function(error) {
            next(error)
        })
    })

    // ======= Journal Members =================================================

    router.get('/journal/:journalId/members', function(request, response, next) {
        journalController.getJournalMembers(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/journal/:journalId/members', function(request, response, next) {
        journalController.postJournalMembers(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/journal/:journalId/member/:userId', function(request, response, next) {
        journalController.getJournalMember(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/journal/:journalId/member/:userId', function(request, response, next) {
        journalController.putJournalMember(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/journal/:journalId/member/:userId', function(request, response, next) {
        journalController.patchJournalMember(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/journal/:journalId/member/:userId', function(request, response, next) {
        journalController.deleteJournalMember(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Journal Submission REST Routes
     *************************************************************************/

    const JournalSubmissionController = require('./controllers/JournalSubmissionController')
    const journalSubmissionController = new JournalSubmissionController(core)

    // ======= Journal Submissions =============================================
    // These are the papers submitted to the journal.

    router.get('/journal/:journalId/submissions', function(request, response, next) {
        journalSubmissionController.getSubmissions(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/journal/:journalId/submissions', function(request, response, next) {
        journalSubmissionController.postSubmissions(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/journal/:journalId/submission/:id', function(request, response, next) {
        journalSubmissionController.getSubmission(request, response).catch(function(error) {
            next(error)
        })
    })

    router.put('/journal/:journalId/submission/:id', function(request, response, next) {
        journalSubmissionController.putSubmission(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/journal/:journalId/submission/:id', function(request, response, next) {
        journalSubmissionController.patchSubmission(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/journal/:journalId/submission/:id', function(request, response, next) {
        journalSubmissionController.deleteSubmission(request, response).catch(function(error) {
            next(error)
        })
    })

    // ======= Journal Submission Reviewers ====================================

    router.post('/journal/:journalId/submission/:submissionId/reviewers', function(request, response, next) {
        journalSubmissionController.postReviewers(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/journal/:journalId/submission/:submissionId/reviewer/:userId', function(request, response, next) {
        journalSubmissionController.deleteReviewer(request, response).catch(function(error) {
            next(error)
        })
    })

    // ======= Journal Submission Editors ====================================

    router.post('/journal/:journalId/submission/:submissionId/editors', function(request, response, next) {
        journalSubmissionController.postEditors(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/journal/:journalId/submission/:submissionId/editor/:userId', function(request, response, next) {
        journalSubmissionController.deleteEditor(request, response).catch(function(error) {
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


