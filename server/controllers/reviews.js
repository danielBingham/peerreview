const ReviewDAO = require('../daos/review')
const ReputationGenerationService = require('../services/ReputationGenerationService')
const ReputationPermissionService = require('../services/ReputationPermissionService')

/**
 *
 */
module.exports = class ReviewController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.reviewDAO = new ReviewDAO(database)
        
        this.reputationService = new ReputationGenerationService(database, logger)
        this.reputationPermissionService = new ReputationPermissionService(database, logger)
    }

    async countReviews(request, response) {
        if ( ! request.session.user ) {
           throw new ControllerError(403, 'not-authorized', `Must be logged in to view reviews.`) 
        }

        const counts = await this.reviewDAO.countReviews(`WHERE reviews.status != 'in-progress'`)
        return response.status(200).json(counts)
    }


    /**
     * GET /paper/:paper_id/reviews
     *
     * Return a JSON array of all reviews in the database.
     */
    async getReviews(request, response) {

        const paperId = request.params.paper_id
        let userId = null

        if ( request.session.user ) {
            userId = request.session.user.id
        }

        // There are different view permissions for reviews on a draft paper
        // than for reviews on a published paper.
        // -- Papers which are published, all reviews are public.
        // -- Papers which are still drafts are only visible to users who pass the
        // `review` threshold.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ paperId ]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${paperId}) to return reviews for.`)
        }

        const isDraft = paperResults.rows[0].isDraft
        if ( isDraft ) {
            if ( ! userId ) {
                throw new ControllerError(401, 
                    'not-authenticated', `Unauthenticated user attempting to view reviews for draft Paper(${paperId}).`)
            }

            const canReview = await this.reputationPermissionService.canReview(userId, paperId)
            if ( ! canReview ) {
                throw new ControllerError(403, 
                    'not-authorized', `Unauthorized User(${userId}) attempting to view reviews for draft Paper(${paperId}).`)
            }
        }

        // At this point, we've confirmed that they are allowed to be here.
        let reviews = []
        if ( userId ) {
            reviews = await this.reviewDAO.selectReviews(
                `WHERE reviews.paper_id=$1 AND (reviews.status != 'in-progress' OR reviews.user_id = $2)`, 
                [ paperId, userId ]
            )
        } else {
            reviews = await this.reviewDAO.selectReviews(
                `WHERE reviews.paper_id=$1 AND reviews.status != 'in-progress'`, 
                [ paperId ]
            )
        }

        if ( ! reviews ) {
            return response.status(200).json([])
        }

        // Doesn't need an await, since this just works with the comments in
        // memory and doesn't hit the database.
        this.reviewDAO.selectVisibleComments(userId, reviews)
        return response.status(200).json(reviews)
    }

    /**
     * POST /paper/:paper_id/reviews
     *
     * Create a new review in the database from the provided JSON.
     */
    async postReviews(request, response) {
        const review = request.body
        review.paperId = request.params.paper_id

        // Have to be authenticated to add a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to POST review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id
        // Reviews may only be added to draft papers, so we need to determine
        // whether this paper is a draft.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ review.paperId ]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // Reviews can only be added to draft papers.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        // Determine whether the user has enough reputation to review this
        // paper.  Also checks for authorship, which grants permissions to
        // review.
        const canReview = await this.reputationPermissionService.canReview(userId, review.paperId)
        if ( ! canReview ) {
            throw new ControllerError(403, 
                'not-authorized', `Unauthorized User(${userId}) attempting to view reviews for draft Paper(${review.paperId}).`)
        }


        const results = await this.database.query(`
                INSERT INTO reviews (paper_id, user_id, version, summary, recommendation, status, created_date, updated_date) 
                    VALUES ($1, $2, $3, $4, $5, $6, now(), now()) 
                    RETURNING id
                `, 
            [ review.paperId, userId, review.version, review.summary, review.recommendation, review.status ]
        )
        if ( results.rows.length == 0 ) {
            throw new ControllerError(500, 'server-error', `User(${userId}) failed to insert a new review on Paper(${review.paperId})`)
        }

        review.id = results.rows[0].id
        await this.reviewDAO.insertThreads(review) 

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new ControllerError(500, 'server-error', `Failed to find newly inserted review ${review.id}.`)
        }

        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(201).json(returnReviews[0])
    }

    /**
     * GET /paper/:paper_id/review/:id
     *
     * Get details for a single review in the database.
     */
    async getReview(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.id

        let userId = null
        if ( request.session && request.session.user ) {
            userId = request.session.user.id
        }

        // There are different view permissions for reviews on a draft paper
        // than for reviews on a published paper.
        // -- Papers which are published, all reviews are public.
        // -- Papers which are still drafts are only visible to users who pass the
        // `review` threshold.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ paperId ]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${paperId}) to return reviews for.`)
        }

        const isDraft = paperResults.rows[0].isDraft
        if ( isDraft ) {
            if ( ! userId ) {
                throw new ControllerError(401, 
                    'not-authenticated', `Unauthenticated user attempting to view reviews for draft Paper(${paperId}).`)
            }

            const canReview = await this.reputationPermissionService.canReview(userId, paperId)
            if ( ! canReview ) {
                throw new ControllerError(403, 
                    'not-authorized', `Unauthorized User(${userId}) attempting to view reviews for draft Paper(${paperId}).`)
            }
        }

        let reviews = []
        if ( userId ) {
            reviews = await this.reviewDAO.selectReviews(
                `WHERE reviews.id = $1 AND (reviews.status != 'in-progress' OR reviews.user_id = $2)`, 
                [ reviewId, userId ]
            )
        } else {
            reviews = await this.reviewDAO.selectReviews(
                `WHERE reviews.id = $1 AND reviews.status != 'in-progress'`, 
                [ reviewId ]
            )
        }

        if ( ! reviews || reviews.length == 0 ) {
            throw new ControllerError(404, 'no-resource', `Didn't find Review(${reviewId}).`)
        }

        this.reviewDAO.selectVisibleComments(userId, reviews)
        return response.status(200).json(reviews[0])
    }

    /**
     * PUT /paper/:paper_id/review/:id
     *
     * Replace an existing review wholesale with the provided JSON.
     */
    async putReview(request, response) {
        const review = request.body
        review.paperId = request.params.paper_id
        review.id = request.params.id

        /*************************************************************
         * Permissions Checking, Input Validation, and Error handling
         * ***********************************************************/

        // Have to be authenticated to replace a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to POST review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id
        // Reviews may only be added to draft papers, so we need to determine
        // whether this paper is a draft.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ review.paperId]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // Only reviews on a draft can be editted.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        const currentReviewResults = await this.database.query(
            `SELECT status, user_id FROM reviews WHERE id = $1`,
            [ review.id ]
        )
        // You can only PUT a review that exists.  Otherwise POST to create a
        // new review.
        if ( currentReviewResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `User(${userId}) attempted to PUT Review(${review.id}) that doesn't exist.`)
        }

        const reviewWriterId = currentReviewResults.rows[0].user_id 
        const reviewStatus = currentReviewResults.rows[0].status

        // Users may only replace their own reviews.  Authors of the paper
        // under review can update the status of a review to mark it `accepted`
        // or `rejected`, but they must use a PATCH request to do so.
        if ( reviewWriterId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to PUT Review(${review.id}) that they did not write.`)
        }

        // Users may only edit reviews while they are in-progress. Once they
        // are submitted, they may not be editted.
        if ( reviewStatus != 'in-progress' ) {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempted to PUT Review(${review.id}), but it was not in progress.`)
        }

        // Confirm that the two match for now. In the future, we may allow
        // admins to modify reviews.  For this reason, throw an error on
        // mismatch rather than just fixing it (saves us bug hunting later).
        if ( userId != review.userId ) {
            throw new ControllerError(400, 'user-mismatch',
                `User(${review.userId}) defined in Review(${review.id}) PUT body does not match logged in User(${userId}).`)
        }

        /********************************************************
         * Execute the Update
         ********************************************************/

        // Update the review.
        const results = await this.database.query(`
                UPDATE reviews 
                    SET paper_id = $1, user_id = $2, version = $3, summary = $4, recommendation = $5, status = $6, updated_date = now() 
                WHERE id = $7 
                `,
            [ review.paperId, reivew.userId, review.version, review.summary, review.recommendation, review.status, review.id]
        )

        if (results.rowCount == 0 ) {
            throw new ControllerError(500, 'server-error'
                `Failed to update Review(${review.id}).`)
        }

        // Delete the threads so we can recreate them from the request.
        const deletionResults = await this.database.query(`
                DELETE FROM review_comment_threads WHERE review_id = $1
                `,
            [ review.id ]
        )

        await this.reviewDAO.insertThreads(reveiw)

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new ControllerError(500, 'server-error', `Failed to find updated Review(${review.id}).`)
        }

        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(200).json(returnReviews[0])
    }

    /**
     * PATCH /paper/:paper_id/review/:id
     *
     * Update an existing review given a partial set of fields in JSON.
     *
     * Only changes the top level resource (reviews, in this case).  Does
     * nothing with children (comments).
     */
    async patchReview(request, response) {
        let review = request.body
        // We want to use the ids in params over any id in the body.
        review.id = request.params.id
        review.paperId = request.params.paper_id

        /*************************************************************
         * Permissions Checking, Input Validation, and Error handling
         * ***********************************************************/

        // Have to be authenticated to modify a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to PATCH review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ review.paperId]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // Only reviews on a draft can be modified.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        const currentReviewResults = await this.database.query(
            `SELECT status, user_id FROM reviews WHERE id = $1`,
            [ review.id ]
        )

        // You can only PATCH a review that exists.  Otherwise POST to create a
        // new review.
        if ( currentReviewResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `User(${userId}) attempted to PATCH Review(${review.id}) that doesn't exist.`)
        }

        const reviewWriterId = currentReviewResults.rows[0].user_id
        const reviewStatus = currentReviewResults.rows[0].status

        // Users may only replace their own reviews.  Authors of the paper under review can update the status of a 
        // review to mark it `accepted` or `rejected`, but they must use a PATCH request to do so.
        if (reviewStatus != 'in-progress' && reviewWriterId != userId ) {
            // Determine whether the authenticated user is one of the paper's authors. 
            const authorResults = await this.database.query( `
                    SELECT user_id from paper_authors where paper_id = $1 AND user_id = $2
                `, [ review.paperId, userId ])

            // If we get no results, they aren't an author of the paper.
            // Which means they aren't allowed to be here.
            if ( authorResults.rows.length <= 0 ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${userId}) attempted to PATCH Review(${review.id}) that they did not write.`)
            }

            // If they are an author and are attempting to update the status of
            // the review to an accepted value (accepted or rejected) then
            // we'll let them do it.  Update the review body to only include
            // allowed changes and proceed.
            if ( review.status == 'accepted' || review.status == 'rejected' ) {
                review = {
                    id: review.id,
                    paperId: review.paperId,
                    status: review.status
                }
            } else {
                // Otherwise, log the attempt.
                this.logger.warn('Attempted unauthorized change: ')
                this.logger.warn(review)
                throw new ControllerError(403, 'unauthorized-change',
                    `User(${userId}) is an author of Paper(${review.paperId}) and is attempting to modify Review(${review.id}).`)
            }

        // Users may only edit reviews while they are in-progress. Once they
        // are submitted, they may not be editted.
        } else  if ( reviewStatus != 'in-progress' ) {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempted to PATCH Review(${review.id}), but it was not in progress.`)

        // If we get here, we've already covered the cases where someone other
        // than the writer of the review may modify it. So reject.
        } else if ( reviewWriterId != userId ) {
            throw new ControllerError(403, 'unauthorized-change',
                `User(${userId}) is attempting to modify Review(${review.id}) they did not write.`)
        }

        /********************************************************
         * Execute the Update
         ********************************************************/

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'threads', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE reviews SET '
        let params = []
        let count = 1
        for(let key in review) {
            if (ignoredFields.includes(key)) {
                continue
            }

            if ( key == 'paperId' ) {
                sql += 'paper_id = $' + count + ', '
            } else if ( key == 'userId' ) {
                sql += 'user_id = $' + count + ', '
            } else {
                sql += key + ' = $' + count + ', '
            }

            params.push(review[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(review.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new ControllerError(500, 'server-error', 
                `User(${userId}) failed to update Review(${review.id}).`)
        }

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Review(${review.id}) after User(${userId}) updated it.`)
        }

        // We'll use the return review to increment the reputation since
        // that will have all the information we need.
        // If we got here, the update was successful.
        if ( reviewStatus != 'accepted' && returnReviews[0].status == 'accepted' ) {
            await this.reputationService.incrementReputationForReview(returnReviews[0])
        }
        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(200).json(returnReviews[0])
    }

    /**
     * DELETE /paper/:paper_id/review/:id
     *
     * Delete an existing review.
     */
    async deleteReview(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.id

        /*************************************************************
         * Permissions Checking, Input Validation, and Error handling
         * ***********************************************************/

        // Have to be authenticated to delete a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to DELETE review on Paper(${paperId}).`)
        }

        const userId = request.session.user.id

        // Only reviews on draft papers may be deleted.  So we need to
        // determine whether this is a draft paper.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ paperId]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${paperId}) to return reviews for.`)
        }

        // Only reviews on a draft can be deleted.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${paperId}).`)
        }

        const currentReviewResults = await this.database.query(
            `SELECT status, user_id FROM reviews WHERE id = $1`,
            [ reviewId ]
        )

        // You can only delete a review that exists.  
        if ( currentReviewResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `User(${userId}) attempted to PUT Review(${reviewId}) that doesn't exist.`)
        }

        const reviewWriterId = currentReviewResults.rows[0].user_id
        const reviewStatus = currentReviewResults.rows[0].status

        // Users may only delete their own reviews, not anyone else's.
        if ( reviewWriterId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to PUT Review(${reviewId}) that they did not write.`)
        }

        // Users may only delete reviews that are 'in-progress', once they are
        // submitted they may no longer be deleted.
        if (reviewStatus != 'in-progress' ) {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempted to PUT Review(${reviewId}), but it was not in progress.`)
        }

        /********************************************************
         * Execute the Update
         ********************************************************/

        const results = await this.database.query(
            'delete from reviews where id = $1',
            [ reviewId ]
        )

        if ( results.rowCount == 0) {
            throw new ControllerError(500, 'server-error', `Failed to delete review ${reviewId}.`)
        }

        return response.status(200).json({ id: reviewId })
    }

    /**
     * /paper/:paper_id/review/:reivew_id/threads
     *
     * Start a new comment thread on a paper.
     */
    async postThreads(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id

        // Have to be authenticated to add a comment thread to a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to POST review thread on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id
        // Comment threads may only be added to draft papers.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ review.paperId ]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // Comment threads can only be added to draft papers.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        const userCheckResults = await this.database.query(`SELECT user_id FROM reviews WHERE id = $1`, [ reviewId ])
        if ( userCheckResults.rows.length == 0 ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Review(${reviewId}) to add comment thread to.`)
        } 

        if ( userCheckResults.rows[0].user_id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempting to add comment thread to Review(${reviewId}) when not authorized.`)
        }

        let threads = []
        if ( ! request.body.length ) {
            threads.push(request.body)
        } else {
            threads = request.body
        }

        const review = {
            id: reviewId,
            paperId: paperId,
            threads: threads
        }
        const threadIds = await this.reviewDAO.insertThreads(review)

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new ControllerError(500, 'server-error', 
                `Failed to find review ${reviewId} after inserting new threads.`)
        }

        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(200).json({ review: returnReviews[0], threadIds: threadIds })
    }

    async deleteThread(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id

        // Have to be authenticated to delete a comment thread.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to DELETE review thread on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id
        // Comment threads may only be deleted from draft papers.
        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft" FROM papers WHERE papers.id = $1',
            [ review.paperId ]
        )
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // Comment threads can only be deleted from draft papers.
        const isDraft = paperResults.rows[0].isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        // Make sure we don't just rely on `reviewId` because the user could
        // enter any review's id.
        const userCheckResults = await this.database.query(
            `SELECT reviews.id as review_id, reviews.user_id as user_id
                FROM reviews 
                    JOIN review_comment_threads ON review_comment_threads.review_id = reviews.id
                WHERE review_comment_threads.id = $1`, 
            [ threadId ])
        if ( userCheckResults.rows.length == 0 ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Review(${reviewId}) to delete comment thread from.`)
        } 

        if ( userCheckResults.rows[0].user_id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempting to delete comment thread from Review(${reviewId}) when not authorized.`)
        }

        if ( userCheckResults.rows[0].review_id != reviewId ) {
            throw new ControllerError(400, 'review-thread-mismatch',
                `User(${userId}) attempting to delete comment thread from Review(${reviewId}), but thread belongs to Review(${userCheckResults.rows[0].review_id}).`)
        }

        const results = await this.database.query('DELETE FROM review_comment_threads WHERE id = $1', [ threadId ])
        if ( results.rowCount == 0) {
            throw new ControllerError(500, 'server-error',
                `Attempted to delete review comment Thread(${threadId}), but deleted nothing.`)
        }

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new ContollerError(500, 'server-error', 
                `Failed to find review ${reviewId} after deleting thread ${threadId}.`)
        }
        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(200).json(returnReviews[0])
    }

    async postComments(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id

        //  Have to be authenticated to add a comment to a review thread.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to POST review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        // Need to check whether this paper is a draft or not.
        const existingResults = await this.database.query(
            `SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as review_status
                FROM papers 
                    JOIN reviews on papers.id = reviews.paper_id
                    JOIN review_comment_threads on review_comment_threads.review_id = reviews.id
                WHERE review_comment_threads.id = $1
            `, [ threadId ]
        )
        if ( existingResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Thread(${threadId}) found.`)
        }

        // Make sure all our ids match up.
        const existing = existingResults.rows[0]
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch', 
                `Thread(${threadId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }
        if ( existing.review_id != reviewId ) {
            throw new ControllerError(400, 'id-mismatch',
                `Thread(${threadId}) is on Review(${existing.review_id}) not Review(${reviewId}).`)
        }

        // Comments may only be added to reviews on papers which are drafts.
        const isDraft = existing.paper_isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${paperId}).`)
        }

        // Determine whether the user has enough reputation to review this
        // paper.  Also checks for authorship, which grants permissions to
        // review.
        const canReview = await this.reputationPermissionService.canReview(userId, paperId)
        if ( ! canReview ) {
            throw new ControllerError(403, 
                'not-authorized', `Unauthorized User(${userId}) attempting to view reviews for draft Paper(${paperId}).`)
        }

        if ( existing.review_status == 'in-progress' && existing.review_userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempting to add comment to in-progress Review(${reviewId}) they didn't start.`)
        }

        let comments = []
        if ( ! request.body.length ) {
            comments.push(request.body)
        } else {
            comments = request.body
        }

        const thread = {
            id: threadId,
            comments: comments
        }

        await this.reviewDAO.insertComments(thread)

        const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! returnReviews || returnReviews.length == 0) {
            throw new Error(`Failed to find review ${reviewId} after adding comments.`)
        }
        this.reviewDAO.selectVisibleComments(userId, returnReviews)
        return response.status(200).json(returnReviews[0])
    }

    async patchComment(request, response) {
        try {
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id
            const threadId = request.params.thread_id
            const commentId = request.params.comment_id

            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT user_id FROM review_comments WHERE id = $1`, [ commentId ])

            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( userId == null || userCheckResults.rows[0].user_id != userId) {
                return response.status(403).json({ error: 'not-authorized' })
            }

            const comment = request.body
            comment.id = commentId

            // We'll ignore these fields when assembling the patch SQL.  These are
            // fields that either need more processing (authors) or that we let the
            // database handle (date fields, id, etc)
            const ignoredFields = [ 'id', 'createdDate', 'updatedDate' ]

            let sql = 'UPDATE review_comments SET '
            let params = []
            let count = 1
            for(let key in comment) {
                if (ignoredFields.includes(key)) {
                    continue
                }

                if ( key == 'threadId' ) {
                    sql += 'thread_id = $' + count + ', '
                } else if ( key == 'userId' ) {
                    sql += 'user_id = $' + count + ', '
                } else if ( key == 'threadOrder' ) {
                    sql += 'thread_order = $' + count + ', '
                } else {
                    sql += key + ' = $' + count + ', '
                }

                params.push(comment[key])
                count = count + 1
            }
            sql += 'updated_date = now() WHERE id = $' + count
            params.push(comment.id)

            const results = await this.database.query(sql, params)

            if ( results.rowCount == 0 ) {
                throw new Error(`Failed to update comment ${commentId}.`)
            }

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ reviewId ])
            if ( ! returnReviews || returnReviews.length == 0 ) {
                throw new Error (`Failed to find review ${reviewId} after updating related comment ${commentId}.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])

        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }

    }

    async deleteComment(request, response) {
        try {
            const reviewId = request.params.review_id
            const commentId = request.params.comment_id

            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT user_id FROM review_comments WHERE id = $1`, [ commentId ])

            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( userId == null || userCheckResults.rows[0].user_id != userId) {
                return response.status(403).json({ error: 'not-authorized' })
            }

            // If this is the last comment in the thread, then we want to
            // delete the whole thread.
            const threadResults = await this.database.query(`SELECT count(id), thread_id FROM review_comments where thread_id in (SELECT thread_id FROM review_comments WHERE id = $1) group by thread_id`, [ commentId ])
            if ( threadResults.rows.length > 0 && threadResults.rows[0].count == 1) {
                const results = await this.database.query(`DELETE FROM review_comment_threads where id = $1`, [ threadResults.rows[0].thread_id ])

                if ( results.rowCount == 0) {
                    throw new Error(`Failed to delete thread ${threadResults.rows[0].thread_id}`)
                }
            } else {
                const results = await this.database.query('DELETE FROM review_comments WHERE id = $1', [ commentId ])

                if ( results.rowCount == 0 ) {
                    throw new Error(`Failed to delete comment ${commentId}.`)
                }
            }

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ reviewId ])
            if ( ! returnReviews || returnReviews.length == 0 ) {
                throw new Error (`Failed to find review ${reviewId} after updating related comment ${commentId}.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }
    }



} 
