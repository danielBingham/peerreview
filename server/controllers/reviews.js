const ReviewDAO = require('../daos/review')
const ReputationService = require('../services/reputation')

/**
 *
 */
module.exports = class ReviewController {

    constructor(database) {
        this.database = database
        this.reviewDAO = new ReviewDAO(database)
        this.reputationService = new ReputationService(database)
    }


    /**
     * GET /paper/:paper_id/reviews
     *
     * Return a JSON array of all reviews in the database.
     */
    async getReviews(request, response) {
        try {
            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }
            let reviews = []

            if ( userId ) {
                reviews = await this.reviewDAO.selectReviews(`WHERE reviews.paper_id=$1 AND (reviews.status != 'in-progress' OR reviews.user_id =$2)`, [ request.params.paper_id, userId ])
            } else {
                reviews = await this.reviewDAO.selectReviews(`WHERE reviews.paper_id=$1 AND reviews.status != 'in-progress'`, [ request.params.paper_id ])
            }

            if ( ! reviews ) {
                return response.status(200).json([])
            }

            this.reviewDAO.selectVisibleComments(userId, reviews)
            return response.status(200).json(reviews)
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }
    }

    /**
     * POST /paper/:paper_id/reviews
     *
     * Create a new review in the database from the provided JSON.
     */
    async postReviews(request, response) {
        const review = request.body
        review.paperId = request.params.paper_id

        let userId = null
        if ( request.session && request.session.user) {
            userId = request.session.user.id
        }

        if ( ! userId ) {
            throw new Error('Attempt to create a review when not authenticated.')
        }

        try {
            const results = await this.database.query(`
                INSERT INTO reviews (paper_id, user_id, version, summary, recommendation, status, created_date, updated_date) 
                    VALUES ($1, $2, $3, $4, $5, $6, now(), now()) 
                    RETURNING id
                `, 
                [ review.paperId, userId, review.version, review.summary, review.recommendation, review.status ]
            )
            if ( results.rows.length == 0 ) {
                throw new Error('Failed to insert a new review.')
            }

            review.id = results.rows[0].id
            await this.reviewDAO.insertThreads(review) 

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
            if ( ! returnReviews || returnReviews.length == 0) {
                throw new Error(`Failed to find newly inserted review ${review.id}.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(201).json(returnReviews[0])
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'server-error'})
        }
    }

    /**
     * GET /paper/:paper_id/review/:id
     *
     * Get details for a single review in the database.
     */
    async getReview(request, response) {
        try {
            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            let reviews = []
            if ( userId ) {
                reviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1 AND (reviews.status != 'in-progress' OR reviews.user_id = $2)`, [ request.params.review_id, userId ])
            } else {
                reviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1 AND reviews.status != 'in-progress'`, [ request.params.review_id ])
            }

            if ( ! reviews || reviews.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            }

            this.reviewDAO.selectVisibleComments(userId, reviews)
            return response.status(200).json(reviews[0])
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }
    }

    /**
     * PUT /paper/:paper_id/review/:id
     *
     * Replace an existing review wholesale with the provided JSON.
     */
    async putReview(request, response) {
        try {
            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const review = request.body
            review.paperId = request.params.paper_id
            review.id = request.params.id

            if ( userId != review.userId ) {
                return response.status(403).json({ error: 'not-authorized' })
            }


            // Update the review.
            const results = await this.database.query(`
                UPDATE reviews 
                    SET paper_id = $1, user_id = $2, version = $3, summary = $4, recommendation = $5, status = $6, updated_date = now() 
                WHERE id = $7 
                `,
                [ review.paperId, reivew.userId, review.version, review.summary, review.recommendation, review.status, review.id]
            )

            if (results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
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
                throw new Error(`Failed to find updated review ${review.id}.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'server-error'})
        }
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
        try {
            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            let review = request.body

            // We want to use the ids in params over any id in the body.
            review.id = request.params.id
            review.paperId = request.params.paper_id

            // ============== Authorization Checks ============================
            const userCheckResults = await this.database.query(`SELECT user_id FROM reviews WHERE id = $1`, [ review.id ])
            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( ! userId ) {
                return response.status(403).json({ error: 'not-authorized' })
            } else if (userCheckResults.rows[0].user_id != userId ) {
                const authorResults = await this.database.query( `
                    SELECT user_id from paper_authors where paper_id = $1
                `, [ review.paperId ])

                // Paper authors are only allowed to modify the review status, and then only to set it to 
                // either "accepted" or "rejected".
                if ( authorResults.rows.length > 0 && authorResults.rows.find((r) => r.user_id == userId)) {
                    if ( review.status == 'accepted' || review.status == 'rejected') {
                        review = {
                            id: review.id,
                            paperId: review.paperId,
                            status: review.status
                        }
                    } else {
                        return response.status(403).json({ error: 'not-authorized' })
                    }
                } else {
                    return response.status(403).json({ error: 'not-authorized' })
                }
            }

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
                return response.status(404).json({error: 'no-resource'})
            }

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
            if ( ! returnReviews || returnReviews.length == 0) {
                throw new Error(`Failed to find patched review ${review.id}.`)
            }

            // We'll use the return review to increment the reputation since
            // that will have all the information we need.
            if ( review.status == 'accepted' ) {
                await this.reputationService.incrementReputationForReview(returnReviews[0])
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])
        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'server-error'})
        }
    }

    /**
     * DELETE /paper/:paper_id/review/:id
     *
     * Delete an existing review.
     */
    async deleteReview(request, response) {
        try {
            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT user_id FROM reviews WHERE id = $1`, [ request.params.id ])
            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( ! userId || userCheckResults.rows[0].user_id != userId ) {
                return response.status(403).json({ error: 'not-authorized' })
            }

            const results = await this.database.query(
                'delete from reviews where id = $1',
                [ request.params.id ]
            )

            if ( results.rowCount == 0) {
                throw new Error(`Failed to delete review ${request.params.id}.`)
            }

            return response.status(200).json({reviewId: request.params.id})
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    async postThreads(request, response) {
        try {
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id

            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT user_id FROM reviews WHERE id = $1`, [ reviewId ])
            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( ! userId || userCheckResults.rows[0].user_id != userId ) {
                return response.status(403).json({ error: 'not-authorized' })
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
            await this.reviewDAO.insertThreads(review)

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
            if ( ! returnReviews || returnReviews.length == 0) {
                throw new Error(`Failed to find review ${reviewId} after inserting new threads.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])
        } catch (error) {
            console.log(error)
            return response.status(500).json({ error: 'server-error' })
        }

    }

    async deleteThread(request, response) {
        try {
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id
            const threadId = request.params.thread_id

            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT user_id FROM reviews WHERE id = $1`, [ reviewId ])
            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else if ( ! userId || userCheckResults.rows[0].user_id != userId ) {
                return response.status(403).json({ error: 'not-authorized' })
            }

            const results = await this.database.query('DELETE FROM review_comment_threads WHERE id = $1', [ threadId ])

            if ( results.rowCount == 0) {
                return response.status(404).json({ error: 'no-resource' })
            }

            const returnReviews = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
            if ( ! returnReviews || returnReviews.length == 0) {
                throw new Error(`Failed to find review ${reviewId} after deleting thread ${threadId}.`)
            }
            this.reviewDAO.selectVisibleComments(userId, returnReviews)
            return response.status(200).json(returnReviews[0])
        } catch (error) {
            console.log(error)
            return response.status(500).json({ error: 'server-error' })
        }
    }

    async postComments(request, response) {
        try {
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id
            const threadId = request.params.thread_id

            let userId = null
            if ( request.session && request.session.user ) {
                userId = request.session.user.id
            }

            const userCheckResults = await this.database.query(`SELECT status, user_id FROM reviews WHERE id = $1`, [ reviewId ])

            if ( userCheckResults.rows.length == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            } else {
                const reviewPart = userCheckResults.rows[0]
                if ( reviewPart.status == 'in-progress' && reviewPart.user_id != userId ) {
                    return response.status(403).json({ error: 'not-authorized' })
                }
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
        } catch (error) {
            console.log(error)
            return response.status(500).json({error: 'server-error'})
        }
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
