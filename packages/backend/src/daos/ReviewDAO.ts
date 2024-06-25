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
import { Pool, Client, QueryResultRow } from 'pg'

import { Core, DAOError } from '@danielbingham/peerreview-core'

import { Review, ReviewComment, ReviewThread, QueryMeta, ModelDictionary } from '@danielbingham/peerreview-model'

import { DAOQuery, DAOQueryOrder, DAOResult } from './DAO'

export class ReviewDAO {
    core: Core
    database: Client | Pool
    
    constructor(core: Core, database?: Client | Pool) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }
    }

    getReviewCommentSelectionString(): string {
        // Issue #171 - Comment versioning and editing.
        const showVersion =  this.core.features.hasFeature('review-comment-versions-171') 

        return `
        review_comments.id as "ReviewComment_id",
        review_comments.thread_id as "ReviewComment_threadId", 
        review_comments.user_id as "ReviewComment_userId", 
        ${ showVersion ? 'review_comments.version as "ReviewComment_version", ' : '' }
        review_comments.thread_order as "ReviewComment_threadOrder",
        review_comments.status as "ReviewComment_status", 
        review_comments.content as "ReviewComment_content", 
        review_comments.created_date as "ReviewComment_createdDate",
        review_comments.updated_date as "ReviewComment_updatedDate"
        `
    }

    hydrateReviewComment(row: QueryResultRow): ReviewComment {
        const comment: ReviewComment = {
            id: row.ReviewComment_id,
            threadId: row.ReviewComment_threadId,
            userId: row.ReviewComment_userId,
            threadOrder: row.ReviewComment_threadOrder,
            status: row.ReviewComment_status,
            content: row.ReviewComment_content,
            createdDate: row.ReviewComment_createdDate,
            updatedDate: row.ReviewComment_updatedDate
        }
        // Issue #171 - Comment versioning and editing.
        if ( this.core.features.hasFeature('review-comment-versions-171') ) {
            comment.version = row.ReviewComment_version
        }
        return comment
    }

    getReviewThreadSelectionString(): string {
        return `
              review_comment_threads.id as "ReviewThread_id",
              review_comment_threads.review_id as "ReviewThread_reviewId", 
              review_comment_threads.page as "ReviewThread_page", 
              review_comment_threads.pin_x as "ReviewThread_pinX",
              review_comment_threads.pin_y as "ReviewThread_pinY",  
        `
    }

    hydrateReviewThread(row: QueryResultRow): ReviewThread {
        return {
            id: row.ReviewThread_id,
            reviewId: row.ReviewThread_reviewId,
            page: row.ReviewThread_page,
            pinX: row.ReviewThread_pinX,
            pinY: row.ReviewThread_pinY,
            comments: []
        }
    }

    getReviewSelectionString(): string {
        return `
        reviews.id as "Review_id", 
        reviews.paper_id as "Review_paperId", 
        reviews.submission_id as "Review_submissionId",
        reviews.user_id as "Review_userId", 
        reviews.version as "Review_version,
        reviews.number as "Review_number",
        reviews.summary as "Review_summary", 
        reviews.recommendation as "Review_recommendation",
        reviews.status as "Review_status", 
        reviews.created_date as "Review_createdDate",
        reviews.updated_date as "Review_updatedDate",
        `
    }

    hydrateReview(row: QueryResultRow): Review {
        return {
            id: row.Review_id,
            paperId: row.Review_paperId,
            submissionId: row.Review_submissionId,
            userId: row.Review_userId,
            version: row.Review_version,
            number: row.Review_number,
            summary: row.Review_summary,
            recommendation: row.Review_recommendation,
            status: row.Review_status,
            createdDate: row.Review_createdDate,
            updatedDate: row.Review_updatedDate,
            threads: []
        }
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     */
    hydrateReviews(rows: QueryResultRow[]): DAOResult<Review> {
        const dictionary: ModelDictionary<Review> = {}
        const list: number[] = []

        const threadDictionary: { [id: number]: ReviewThread } = {}
        const commentDictionary: { [id: number]: ReviewComment} = {}

        for ( const row of rows ) {
            if ( ! (row.Review_id in dictionary ) ) {
                dictionary[row.Review_id] = this.hydrateReview(row) 
                list.push(row.Review_id)
            }

            if ( ! (row.ReviewThread_id in threadDictionary) ) {
                const thread = this.hydrateReviewThread(row)
                threadDictionary[row.ReviewThread_id] = thread 
                dictionary[row.Review_id].threads.push(thread)
            }

            if ( ! (row.ReviewComment_id in commentDictionary) ) {
                const comment = this.hydrateReviewComment(row)
                commentDictionary[row.ReviewComment_id] = comment
                threadDictionary[row.ReviewThread_id].comments.push(comment)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    /**
     * Select only the comments that should be visible to the user with userId
     * (or to all users if userId is null).
     *
     * Modifies the original dictionary and returns it.
     */
    selectVisibleComments(userId: number, reviewDictionary: ModelDictionary<Review>): ModelDictionary<Review> {
        for( const [id, review] of Object.entries(reviewDictionary)) {
            for ( const thread of review.threads) {
                thread.comments = thread.comments.filter((c: ReviewComment) => {
                    return c.status == "posted" || c.userId == userId
                })
            }
            review.threads = review.threads.filter((t: ReviewThread) => t.comments.length > 0)
        }
        return reviewDictionary 
    }

    async selectReviews(query?: DAOQuery): Promise<DAOResult<Review>> {
        const where = query?.where ? `WHERE ${query.where}` : '' 
        const params = query?.params ? [ ...query.params ] : []

        if ( query?.order !== undefined ) {
            throw new DAOError('not-supported', 'Order not supported.')
        }

        let order = 'reviews.created_date ASC, review_comments.thread_order ASC, review_comments.created_date ASC'

        const sql = `
            SELECT
                ${this.getReviewSelectionString()}
                ${this.getReviewThreadSelectionString()}
                ${this.getReviewCommentSelectionString()}
            FROM reviews
                LEFT OUTER JOIN review_comment_threads on reviews.id = review_comment_threads.review_id
                LEFT OUTER JOIN review_comments on review_comment_threads.id = review_comments.thread_id
            ${where}
            ORDER BY ${order} 
        `

        const results = await this.database.query(sql, params)
        return this.hydrateReviews(results.rows)
    }

    async getPage(query?: DAOQuery): Promise<number[]> {
        const where = query?.where ? `WHERE ${query.where}` : '' 
        const params = query?.params ? [ ...query.params ] : []

        if ( query?.order !== undefined ) {
            throw new DAOError('not-supported', 'Order not supported.')
        }

        let order = 'min(reviews.created_date) ASC, min(review_comments.thread_order) ASC, min(review_comments.created_date) ASC'

        let page = query?.page || 0
        let itemsPerPage = query?.itemsPerPage || 20

        let paging = ''
        if ( page > 0 ) {
            paging = `
                LIMIT ${itemsPerPage}
                OFFSET ${(page-1) * itemsPerPage}
            `
        }

        const sql = `
            SELECT DISTINCT
                reviews.id, min(reviews.created_date), min(review_comments.thread_order), min(review_comments.created_date)
            FROM reviews
                LEFT OUTER JOIN review_comment_threads on reviews.id = review_comment_threads.review_id
                LEFT OUTER JOIN review_comments on review_comment_threads.id = review_comments.thread_id
            ${where}
            GROUP BY reviews.id
            ORDER BY ${order} 
            ${paging}
        `

        const results = await this.database.query(sql, params)
        return results.rows.map((r) => r.id)
    }

    async countReviews(query?: DAOQuery): Promise<QueryMeta> {
        const where = query?.where ? `WHERE ${query.where}` : '' 
        const params = query?.params ? [ ...query.params ] : []

        let page = query?.page || 0
        let itemsPerPage = query?.itemsPerPage || 20

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
                page: page,
                pageSize: itemsPerPage,
                numberOfPages: 1

            }
        }

        const count = results.rows[0].review_count
        return { 
            count: count,
            page: page,
            pageSize: itemsPerPage,
            numberOfPages: 1 
        }

    }

    async insertThreads(review: Review): Promise<number[]> {
        if ( review.threads.length == 0) {
            return []
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
    async insertComments(thread: ReviewThread): Promise<void> {
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
    async insertCommentVersion(comment: ReviewComment, existingVersion: number): Promise<number> {
        if ( ! this.core.features.hasFeature('review-comment-versions-171') ) {
            throw new DAOError('feature-disabled', `insertCommentVersion() may only be used behind feature flag 'review-comment-versioning-171'.`)
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
            throw new DAOError('version-insert-failed', `Failed to insert CommentVersion for Comment(${comment.id}).`)
        }

        return version
    }
   
    /**
     * Creates a new comment and the initial comment version for it.
     */
    async insertComment(comment: ReviewComment): Promise<void> {
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
    async updateComment(comment: ReviewComment): Promise<void> {
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

            params.push(comment[key as keyof ReviewComment])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(comment.id)

        const results = await this.database.query(sql, params)
        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failed', 
                `Failed to update Comment(${comment.id}).`)
        }
    }
}
