/**
 *
 */
module.exports = class ReviewController {

    constructor(database) {
        this.database = database;
    }


    /**
     * GET /paper/:paper_id/reviews
     *
     * Return a JSON array of all reviews in the database.
     */
    async getReviews(request, response) {
        try {
            const reviews = await this.selectReviews(request.params.paper_id);
            console.log(reviews)
            if ( reviews && ! Array.isArray(reviews)) {
                return response.status(200).json([reviews]);
            } else {
                return response.status(200).json(reviews);
            }
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'unknown' });
            return;
        }
    }

    /**
     * POST /paper/:paper_id/reviews
     *
     * Create a new review in the database from the provided JSON.
     */
    async postReviews(request, response) {
        const review = request.body;
        review.paperId = request.params.paper_id

        try {
            const results = await this.database.query(`
                INSERT INTO reviews (paper_id, user_id, summary, status, created_date, updated_date) 
                    VALUES ($1, $2, $3, $4, now(), now()) 
                    RETURNING id
                `, 
                [ review.paperId, review.userId, review.summary, review.status ]
            );
            if ( results.rows.length == 0 ) {
                console.error('Failed to insert a review.');
                return response.status(500).json({error: 'unknown'});
            }

            review.id = results.rows[0].id;

            await this.insertComments(review.id, review.comments); 

            const returnReview = await this.selectReviews(review.paperId, review.id);
            return response.status(201).json(returnReview);
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * GET /paper/:paper_id/review/:id
     *
     * Get details for a single review in the database.
     */
    async getReview(request, response) {
        try {
            const review = await this.selectReviews(request.params.paper_id, request.params.id);
            return response.status(200).json(review);
        } catch (error) {
            console.error(error);
            return response.status(500).send();
        }
    }

    /**
     * PUT /paper/:paper_id/review/:id
     *
     * Replace an existing review wholesale with the provided JSON.
     */
    async putReview(request, response) {
        try {
            const review = request.body;
            review.id = request.params.id;

            // Update the review.
            const results = await this.database.query(`
                UPDATE reviews 
                    SET title = $1 AND is_draft=$2 AND updated_date = now() 
                WHERE id = $3 
                `,
                [ review.title, review.isDraft, review.id ]
            );

            if (results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'});
            }

            // Delete the authors so we can recreate them from the request.
            const deletionResults = await this.database.query(`
                DELETE FROM review_authors WHERE review_id = $1
                `,
                [ review.id ]
            );

            // Reinsert the authors.
            await this.insertAuthors(review);

            const returnReview = await this.selectReviews(review.id);
            return response.status(200).json(returnReview);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'});
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
        let review = request.body;

        // We want to use the ids in params over any id in the body.
        review.id = request.params.id
        review.paperId = request.params.paper_id

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'comments', 'createdDate', 'updatedDate' ];

        let sql = 'UPDATE reviews SET ';
        let params = [];
        let count = 1;
        for(let key in review) {
            if (ignoredFields.includes(key)) {
                continue;
            }
            sql += key + ' = $' + count + ' and ';

            params.push(review[key]);
            count = count + 1;
        }
        sql += 'updated_date = now() WHERE id = $' + count;

        params.push(review.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnReview = await this.selectReviews(review.id);
            return response.status(200).json(returnReview);
        } catch (error) {
            console.error(error);
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
            );

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json({reviewId: request.params.id});
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    async postComments(request, response) {
        try {
            const comment = request.body
            const paperId = request.params.paper_id
            const reviewId = request.params.review_id

            await this.insertComments(reviewId, [comment])

            const review = await this.selectReviews(paperId, reviewId)
            return response.status(200).json(review)
        } catch (error) {
            console.log(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydrateReviews(rows) {
        if ( rows.length == 0 ) {
            return null
        }

        const reviews = {}
        for ( const row of rows ) {
            const review = {
                id: row.review_id,
                paperId: row.review_paperId,
                userId: row.review_userId,
                summary: row.review_summary,
                status: row.review_status,
                createdDate: row.review_createdDate,
                updatedDate: row.review_updatedDate,
                comments: []
            }

            const comment = {
                id: row.comment_id,
                parentId: row.comment_parentId,
                page: row.comment_page,
                pinX: row.comment_pinX,
                pinY: row.comment_pinY,
                content: row.comment_content,
                createdDate: row.comment_createdDate,
                updatedDate: row.comment_updatedDate
            }
            review.comments.push(comment)
            
            if ( ! reviews[review.id] ) {
                reviews[review.id] = review
            } else {
                if ( ! reviews[review.id].comments.find((c) => c.id == comment.id)) {
                    reviews[review.id].comments.push(comment)
                }
            }
        }

        const reviewArray = Object.values(reviews)
        if (reviewArray.length == 1) {
            return reviewArray[0]
        }

        return reviewArray 
    }

    async selectReviews(paperId, id) {
        let review_where = ''
        const params = [ paperId ]
        if ( id ) {
            review_where = ` AND review_id = $2`
            params.push(id)
        }
        

        const sql = `
            SELECT
              reviews.id as review_id, reviews.paper_id as "review_paperId", reviews.user_id as "review_userId", reviews.summary as review_summary, reviews.status as review_status, reviews.created_date as "review_createdDate", reviews.updated_date as "review_updatedDate",
              review_comments.id as comment_id, review_comments.parent_id as "comment_parentId", review_comments.page as comment_page, review_comments.pin_x as "comment_pinX", review_comments.pin_y as "comment_pinY", review_comments.content as comment_content, review_comments.created_date as "comment_createdDate", review_comments.updated_date as "comment_updatedDate"
            FROM reviews
                LEFT OUTER JOIN review_comments on reviews.id = review_comments.review_id
            WHERE paper_id = $1${review_where} 
            ORDER BY reviews.updated_date DESC, review_comments.updated_date DESC
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.count == 0) {
            return null
        }

        const reviews = this.hydrateReviews(results.rows)
        return reviews
    }

    /**
     * Insert the comments for a review.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertComments(reviewId, comments) {
        if ( comments.length == 0) {
            return
        }

        let sql = `INSERT INTO review_comments (review_id, parent_id, page, pin_x, pin_y, content, created_date, updated_date) VALUES `
        const params = []

        let count = 1
        let commentCount = 1

        for( const comment of comments ) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3}, $${count+4}, $${count+5}, now(), now())` + (commentCount < comments.length ? ', ' : '')

            params.push(reviewId, comment.parentId, comment.page, comment.pinX, comment.pinY, comment.content) 
            count = count + 6
            commentCount++
        }

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new Error('Something went wrong in insertComments().  No comments were inserted.')
        }
    }
}; 
