const DAOError = require('../errors/DAOError')

const FeatureService = require('../services/FeatureService')

module.exports = class ReviewDAO {
    
    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydrateReviews(rows) {
        const dictionary = {}
        const list = []

        for ( const row of rows ) {

            if ( ! dictionary[row.review_id] ) {
                const review = {
                    id: row.review_id,
                    paperId: row.review_paperId,
                    paperVersionId: row.review_paperVersionId,
                    userId: row.review_userId,
                    summary: row.review_summary,
                    recommendation: row.review_recommendation,
                    status: row.review_status,
                    createdDate: row.review_createdDate,
                    updatedDate: row.review_updatedDate,
                    threads: []
                }
                dictionary[review.id] = review
                list.push(review.id)
            }

            if ( row.thread_id != null && ! dictionary[row.review_id].threads.find((t) => t.id == row.thread_id) ) {
                const thread = {
                    id: row.thread_id,
                    reviewId: row.thread_reviewId,
                    page: row.thread_page,
                    pinX: row.thread_pinX,
                    pinY: row.thread_pinY,
                    comments: []
                }
                dictionary[row.review_id].threads.push(thread)
            }

            if ( row.comment_id != null) {
                const thread = dictionary[row.review_id].threads.find((t) => t.id == row.comment_threadId)
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

                    // Issue #171 - Comment versioning and editing.
                    if ( this.core.features.hasFeature('review-comment-versions-171') ) {
                        comment.version = row.comment_version
                    }

                    thread.comments.push(comment)
                }
            }
        }

        return { dictionary: dictionary, list: list }
    }

    /**
     * Select only the comments that should be visible to the user with userId
     * (or to all users if userId is null).
     *
     * Modifies the original array and returns it.
     *
     * @param {int} userId The id of the user that is currently logged in, or
     * null if no user is logged in.
     * @param {object[]} reviews A dictionary of reviews who's comments need to be
     * filtered.  Will be modified (filtered in place).
     *
     * @return {object[]} The filter review array
     */
    selectVisibleComments(userId, reviewDictionary) {
        for( const [id, review] of Object.entries(reviewDictionary)) {
            for ( const thread of review.threads) {
                thread.comments = thread.comments.filter((c) => {
                    return c.status == "posted" || c.userId == userId
                })
            }
            review.threads = review.threads.filter((t) => t.comments.length > 0)
        }
        return reviewDictionary 
    }

    async selectReviews(where, params) {
        where = ( where ? where : '' )
        params = ( params ? params : [])

        // Issue #171 - Comment versioning and Editing.
        const showVersion = this.core.features.hasFeature('review-comment-versions-171')

        const sql = `
            SELECT

              reviews.id as review_id, 
              reviews.paper_id as "review_paperId", 
              reviews.paper_version_id as "review_paperVersionId",
              reviews.user_id as "review_userId", 
              reviews.summary as review_summary, 
              reviews.recommendation as review_recommendation, 
              reviews.status as review_status, 
              reviews.created_date as "review_createdDate", 
              reviews.updated_date as "review_updatedDate",

              review_comment_threads.id as thread_id, review_comment_threads.review_id as "thread_reviewId", 
              review_comment_threads.page as thread_page, 
              review_comment_threads.pin_x as "thread_pinX", review_comment_threads.pin_y as "thread_pinY",  

              review_comments.id as comment_id, review_comments.thread_id as "comment_threadId", 
              review_comments.user_id as "comment_userId", 
              ${ showVersion ? 'review_comments.version as comment_version, ' : '' }
              review_comments.thread_order as "comment_threadOrder",  review_comments.status as comment_status, 
              review_comments.content as comment_content, 
              review_comments.created_date as "comment_createdDate", review_comments.updated_date as "comment_updatedDate"

            FROM reviews
                LEFT OUTER JOIN review_comment_threads on reviews.id = review_comment_threads.review_id
                LEFT OUTER JOIN review_comments on review_comment_threads.id = review_comments.thread_id
            ${where}
            ORDER BY reviews.created_date ASC, review_comments.thread_order asc, review_comments.created_date asc
        `

        const results = await this.database.query(sql, params)
        return this.hydrateReviews(results.rows)
    }

    async countReviews(where, params, page) {
        where = ( where ? where : '' )
        params = ( params ? params : [])

        const sql = `
            SELECT
                COUNT(reviews.id) as review_count
            FROM reviews
            ${where}
       `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 || results.rows[0].review_count == 0 ) {
            return { 
                count: 0,
                page: page ? page : 1,
                pageSize: null,
                numberOfPages: 1

            }
        }

        const count = results.rows[0].review_count
        return { 
            count: count,
            page: page ? page : 1,
            pageSize: null,
            numberOfPages: 1 
        }

    }

    async insertThreads(review) {
        if ( review.threads.length == 0) {
            return
        }


        const threadIds = []
        for ( const thread of review.threads) {

            // Override the review ID with the one on `review`.  We don't allow
            // posting threads to multiple reviews at once.
            thread.reviewId = review.id

            let sql = `INSERT INTO review_comment_threads (review_id, page, pin_x, pin_y) 
                        VALUES ($1, $2, $3, $4) RETURNING id`
            const params = [thread.reviewId, thread.page, thread.pinX, thread.pinY]

            const results = await this.database.query(sql, params)
            if ( results.rowCount == 0 ) {
                throw new Error('Something went wrong in insertThreads().  No threads inserted.')
            }
            
            thread.id = results.rows[0].id
            for (const comment of thread.comments) {
                comment.threadId = thread.id
            }

            threadIds.push(thread.id)
            await this.insertComments(thread)
        }
        return threadIds
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

        for ( const comment of thread.comments ) {
            await this.insertComment(comment)
        }
    }

    /**
     * Insert new Comment Version
     *
     * Create a new version of a comment.  If there is no version set on the
     * comment body, we assume this is the first version.  Otherwise, we assume
     * this is the next version and increment the version before insertion.  We
     * return the inserted version.
     *
     * @param {Object} comment  The comment we want to insert a version for.
     *
     * @return {int} The version number of the inserted version.
     */
    async insertCommentVersion(comment, existingVersion) {
        this.logger.debug(`Creating a comment version for Comment(${comment.id}) with verison ${existingVersion}`)
        this.logger.debug(comment)

        if ( ! this.core.features.hasFeature('review-comment-versions-171') ) {
            throw new DAOError(`insertCommentVersion() may only be used behind feature flag 'review-comment-versioning-171'.`)
        }

        const commentVersionSql = `
            INSERT INTO review_comment_versions (comment_id, version, content, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now()) 
        `
        const version = existingVersion ? existingVersion+1 : 1
        const commentVersionResult = await this.database.query(
            commentVersionSql,
            [ comment.id, version, comment.content ]
        )

        if ( commentVersionResult.rowCount == 0 ) {
            throw new DAOError('version-insert-failed', `Failed to insert CommentVersion for Comment(${id}).`)
        }

        return version
    }
   
    /**
     * Creates a new comment and the initial comment version for it.
     */
    async insertComment(comment) {
        const commentSql = `
            INSERT INTO review_comments(thread_id, user_id, thread_order, status, content, created_date, updated_date)
                VALUES ($1, $2, $3, $4, $5, now(), now()) RETURNING id
        `
        const commentParams = [ comment.threadId, comment.userId, comment.threadOrder, comment.status, comment.content ]
        const commentResults = await this.database.query(commentSql, commentParams)

        if ( commentResults.rowCount == 0 ) {
            throw new DAOError('insert-failed', `Failed to insert Comment in Thread(${comment.threadId}).`)
        }

        comment.id = commentResults.rows[0].id
    }


    /**
     * Performs a raw update of the comment.  Only updates the content,
     * version, and/or status fields.  
     *
     * DOES NOT HANDLE VERSIONING.  It is up to the caller to check the current
     * status and commit new versions at appropriate times.
     *
     * @param {Object} comment  The comment to be updated (with updated content).
     */
    async updateComment(comment) {
        // We're only allowing `content` and `status` to be updated.  We're
        // also recording all updates that change `status` as versions.
        const ignoredFields = [ 'id', 'userId', 'threadId', 'number', 'threadOrder', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE review_comments SET '
        let params = []
        let count = 1
        for(let key in comment) {
            if (ignoredFields.includes(key)) {
                continue
            }

            sql += key + ' = $' + count + ', '

            params.push(comment[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(comment.id)

        const results = await this.database.query(sql, params)
        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failed', 
                `Failed to update Comment(${commentId}).`)
        }
    }



}
