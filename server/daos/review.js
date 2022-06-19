module.exports = class ReviewDAO {
    
    constructor(database) {
        this.database = database
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

            if ( ! reviews[row.review_id] ) {
                const review = {
                    id: row.review_id,
                    paperId: row.review_paperId,
                    userId: row.review_userId,
                    summary: row.review_summary,
                    recommendation: row.review_recommendation,
                    status: row.review_status,
                    createdDate: row.review_createdDate,
                    updatedDate: row.review_updatedDate,
                    threads: []
                }
                reviews[review.id] = review
            }

            if ( row.thread_id != null && ! reviews[row.review_id].threads.find((t) => t.id == row.thread_id) ) {
                const thread = {
                    id: row.thread_id,
                    reviewId: row.thread_reviewId,
                    page: row.thread_page,
                    pinX: row.thread_pinX,
                    pinY: row.thread_pinY,
                    comments: []
                }
                reviews[row.review_id].threads.push(thread)
            }

            if ( row.comment_id != null) {
                const thread = reviews[row.review_id].threads.find((t) => t.id == row.comment_threadId)
                if ( ! thread.comments.find((c) => c.id == row.comment_id) ) {
                    const comment = {
                        id: row.comment_id,
                        threadId: row.comment_threadId,
                        userId: row.comment_userId,
                        threadOrder: row.comment_threadOrder,
                        status: row.comment_status,
                        content: row.comment_content,
                        createdDate: row.comment_createdDate,
                        updatedDate: row.comment_updatedDate
                    }
                    thread.comments.push(comment)
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
            review_where = ` AND reviews.id = $2`
            params.push(id)
        }

        const sql = `
            SELECT
              reviews.id as review_id, reviews.paper_id as "review_paperId", reviews.user_id as "review_userId", reviews.summary as review_summary, reviews.recommendation as review_recommendation, reviews.status as review_status, reviews.created_date as "review_createdDate", reviews.updated_date as "review_updatedDate",
              review_comment_threads.id as thread_id, review_comment_threads.review_id as "thread_reviewId", review_comment_threads.page as thread_page, review_comment_threads.pin_x as "thread_pinX", review_comment_threads.pin_y as "thread_pinY",  
              review_comments.id as comment_id, review_comments.thread_id as "comment_threadId", review_comments.user_id as "comment_userId", review_comments.thread_order as "comment_threadOrder", review_comments.status as comment_status, review_comments.content as comment_content, review_comments.created_date as "comment_createdDate", review_comments.updated_date as "comment_updatedDate"
            FROM reviews
                LEFT OUTER JOIN review_comment_threads on reviews.id = review_comment_threads.review_id
                LEFT OUTER JOIN review_comments on review_comment_threads.id = review_comments.thread_id
            WHERE reviews.paper_id = $1${review_where} 
            ORDER BY reviews.updated_date DESC, review_comments.updated_date DESC
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.count == 0) {
            return null
        }

        const reviews = this.hydrateReviews(results.rows)
        return reviews
    }

    async insertThreads(review) {
        if ( review.threads.length == 0) {
            return
        }

        console.log(review)

        for ( const thread of review.threads) {
            let sql = `INSERT INTO review_comment_threads (review_id, page, pin_x, pin_y) 
                        VALUES ($1, $2, $3, $4) RETURNING id`
            const params = [thread.reviewId, thread.page, thread.pinX, thread.pinY]

            const results = await this.database.query(sql, params)
            if ( results.rowCount == 0 ) {
                throw new Error('Something went wrong in insertThreads().  No threads inserted.')
            }
            thread.id = results.rows[0].id

            await this.insertComments(thread)
        }


    }
    

    /**
     * Insert the comments for a review.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertComments(thread) {
        if ( thread.comments.length == 0) {
            return
        }

        let sql = `INSERT INTO review_comments (thread_id, user_id, thread_order, status, content, created_date, updated_date) VALUES `
        const params = []

        let count = 1
        let commentCount = 1

        for( const comment of thread.comments ) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3}, $${count+4}, now(), now())` + (commentCount < thread.comments.length ? ', ' : '')

            params.push(thread.id, comment.userId, comment.threadOrder, comment.status, comment.content) 
            count = count + 5
            commentCount++
        }

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new Error('Something went wrong in insertComments().  No comments were inserted.')
        }
    }

}
