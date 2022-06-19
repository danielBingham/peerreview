const ReviewDAO = require('../daos/review')

/**
 *
 */
module.exports = class ReviewController {

    constructor(database) {
        this.database = database
        this.reviewDAO = new ReviewDAO(database)
    }


    /**
     * GET /paper/:paper_id/reviews
     *
     * Return a JSON array of all reviews in the database.
     */
    async getReviews(request, response) {
        try {
            const reviews = await this.reviewDAO.selectReviews(request.params.paper_id)
            if ( reviews && ! Array.isArray(reviews)) {
                return response.status(200).json([reviews])
            } else {
                return response.status(200).json(reviews)
            }
        } catch (error) {
            console.error(error)
            response.status(500).json({ error: 'unknown' })
            return
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

        try {
            const results = await this.database.query(`
                INSERT INTO reviews (paper_id, user_id, summary, recommendation, status, created_date, updated_date) 
                    VALUES ($1, $2, $3, $4, $5, now(), now()) 
                    RETURNING id
                `, 
                [ review.paperId, review.userId, review.summary, review.recommendation, review.status ]
            )
            if ( results.rows.length == 0 ) {
                console.error('Failed to insert a review.')
                return response.status(500).json({error: 'unknown'})
            }

            review.id = results.rows[0].id
            await this.reviewDAO.insertThreads(review) 

            const returnReview = await this.reviewDAO.selectReviews(review.paperId, review.id)
            return response.status(201).json(returnReview)
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * GET /paper/:paper_id/review/:id
     *
     * Get details for a single review in the database.
     */
    async getReview(request, response) {
        try {
            const review = await this.reviewDAO.selectReviews(request.params.paper_id, request.params.id)
            return response.status(200).json(review)
        } catch (error) {
            console.error(error)
            return response.status(500).send()
        }
    }

    /**
     * PUT /paper/:paper_id/review/:id
     *
     * Replace an existing review wholesale with the provided JSON.
     */
    async putReview(request, response) {
        try {
            const review = request.body
            review.paperId = request.params.paper_id
            review.id = request.params.id

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

            const returnReview = await this.reviewDAO.selectReviews(review.paperId, review.id)
            return response.status(200).json(returnReview)
        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown'})
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
        let review = request.body

        // We want to use the ids in params over any id in the body.
        review.id = request.params.id
        review.paperId = request.params.paper_id

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

        try {
            const results = await this.database.query(sql, params)

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'})
            }

            const returnReview = await this.reviewDAO.selectReviews(review.paperId, review.id)
            return response.status(200).json(returnReview)
        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /paper/:paper_id/review/:id
     *
     * Delete an existing review.
     */
    async deleteReview(request, response) {
        try {
            const results = await this.database.query(
                'delete from reviews where id = $1',
                [ request.params.id ]
            )

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'})
            }

            return response.status(200).json({reviewId: request.params.id})
        } catch (error) {
            console.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    async postThreads(request, response) {
        try {
            console.log('=== postThreads ===')
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id

            console.log('PaperId: ' + paperId)
            console.log('ReviewId: ' + reviewId)
            console.log('Request Body: ')
            console.log(request.body)

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

            const returnReview = await this.reviewDAO.selectReviews(paperId, reviewId)
            console.log("Return Review: ")
            console.log(returnReview)
            return response.status(200).json(returnReview)
        } catch (error) {
            console.log(error)
            return response.status(500).json({ error: 'server-error' })
        }

    }

    async deleteThread(request, response) {
        try {
            const threadId = request.params.thread_id

            const results = await this.database.query('DELETE FROM review_comment_threads WHERE id = $1', [ threadId ])

            if ( results.rowCount == 0) {
                return response.status(404).json({ error: 'no-resource' })
            }

            return response.status(200).json({ threadId: threadId })
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

            const review = await this.reviewDAO.selectReviews(paperId, reviewId)
            return response.status(200).json(review)
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

            const comment = request.body

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
                return response.status(404).json({error: 'no-resource'})
            }

            const returnReview = await this.reviewDAO.selectReviews(paperId, reviewId)
            return response.status(200).json(returnReview)

        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }

    }

    async deleteComment(request, response) {
        try {
            const commentId = request.params.comment_id

            const results = await this.database.query('DELETE FROM review_comments WHERE id = $1', [ commentId ])

            if ( results.rowCount == 0 ) {
                return response.status(404).json({ error: 'no-resource' })
            }

            return response.status(200).json({ commentId: commentId })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'server-error' })
        }
    }



} 
