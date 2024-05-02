
import { Pool, QueryResultRow } from 'pg'

import { Core, DAOError } from '@danielbingham/peerreview-core'
import { JournalSubmission, JournalSubmissionReviewer, ModelDictionary, DatabaseResult } from '@danielbingham/peerreview-model'

const PAGE_SIZE = 20

export class JournalSubmissionDAO {
    core: Core
    database: Pool

    constructor(core: Core, database?: Pool) {
        this.core = core

        // If a database override is provided, use that.  Otherwise, use the
        // database on the core object.
        //
        // We use this for transactions.  The database on the core object is
        // the Pool object from node-pg.  If we want to use transactions, we
        // need to get a Client object from the pool.
        //
        // TECHDEBT - there's probably a better way to do this.
        this.database = ( database ? database : this.core.database )
    }

    /**
     * Return the selection string for the `journal_submissions` table
     * returning values for use with `hydrateJournalSubmission()`.  May be
     * mixed with other selection strings and hydrate functions to generate
     * additional objects.
     *
     * @return {string} The SELECT portion of an SQL query statement for the
     * `journal_submissions` table.
     */
    getJournalSubmissionSelectionString(): string {
        return `
            journal_submissions.id as "JournalSubmission_id",
            journal_submissions.journal_id as "JournalSubmission_journalId",
            journal_submissions.paper_id as "JournalSubmission_paperId",
            journal_submissions.submitter_id as "JournalSubmission_submitterId",
            journal_submissions.submission_comment as "JournalSubmission_submitterComment",
            journal_submissions.status as "JournalSubmission_status",
            journal_submissions.decider_id as "JournalSubmission_deciderId",
            journal_submissions.decision_comment as "JournalSubmission_decisionComment",
            journal_submissions.decision_date as "JournalSubmission_decisionDate",
            journal_submissions.created_date as "JournalSubmission_createdDate",
            journal_submissions.updated_date as "JournalSubmission_updatedDate"
        `

    }

    /** 
     * Hydrate a single JournalSubmission from a single QueryResultRow
     * generated using `getJournalSubmissionSelectionString()`. Any additional
     * fields will be ignored.
     */
    hydrateJournalSubmission(row: QueryResultRow): JournalSubmission {
        return {
            id: row.JournalSubmission_id,
            journalId: row.JournalSubmission_journalId,
            paperId: row.JournalSubmission_paperId,
            submitterId: row.JournalSubmission_submitterId,
            submitterComment: row.JournalSubmission_submitterComment,
            status: row.JournalSubmission_status,
            deciderId: row.JournalSubmission_deciderId,
            decisionComment: row.JournalSubmission_decisionComment,
            decisionDate: row.JournalSubmission_decisionDate,
            createdDate: row.JournalSubmission_createdDate,
            updatedDate: row.JournalSubmission_updatedDate,
            reviewers: [],
            editors: []
        }
    }

    /**
     * Field component of an SQL SELECT statement for selecting the fields
     * matching the JournalSubmissionReviewer type.
     *
     * @return {string} The SQL SELECT statement's field component.
     */
    getJournalSubmissionReviewerSelectionString(): string {
        return `
        journal_submission_reviewers.submission_id as "JournalSubmissionReviewer_submissionId",
        journal_submission_reviewers.user_id as "JournalSubmissionReviewer_userId",
        journal_submission_reviewers.created_date as "JournalSubmissionReviewer_assignedDate",
        `
    }

    hydrateJournalSubmissionReviewer(row: QueryResultRow): JournalSubmissionReviewer {
        return {
            userId: row.JournalSubmissionReviewer_userId,
            assignedDate: row.JournalSubmissionReviewer_assignedDate,
            reviews: []
        }

    }

    /**
     * Hydrate a one or more JournalSubmission models from an array of
     * QueryResultRow returned by pg's `Pool` or `Client`.  Return a populated
     * `DatabaseResult<JournalSubmission>`.
     *
     * @param {QueryResultRow[]} rows   The rows containing the results of a
     * database query made with the contents of
     * `getJournalSubmissionSelectionString()`.  May include additional fields,
     * which will be ignored.
     *
     * @return {DatabaseResult<JournalSubmission>} The populated DatabaseResult.
     */
    hydrateJournalSubmissions(rows: QueryResultRow[]): DatabaseResult<JournalSubmission> {
        const dictionary: ModelDictionary<JournalSubmission> = {}
        const list: number[] = []

        for(const row of rows) {
            if ( ! (row.JournalSubmission_id in dictionary)) {
                dictionary[row.JournalSubmission_id] = this.hydrateJournalSubmission(row)
                list.push(row.JournalSubmission_id)
            }

            let reviewer = {
                userId: row.JournalSubmissionReviewer_userId,
                assignedDate: row.JournalSubmissionReviewer_assignedDate,
                reviews: []
            }

            if ( reviewer.userId != null 
                && ! dictionary[submission.id].reviewers.find((r) => r.userId == reviewer.userId) ) 
            {
                dictionary[submission.id].reviewers.push(reviewer)
            }

            const review = {
                id: row.review_id,
                version: row.review_version,
                recommendation: row.review_recommendation,
                userId: row.review_userId
            }

            reviewer = dictionary[submission.id].reviewers.find((r) => r.userId == review.userId)
            if ( review.id != null && reviewer != null 
                && ! reviewer.reviews.find((r) => r.id == review.id) ) 
            {
                reviewer.reviews.push(review)
            }

            const editor = {
                userId: row.editor_userId,
                assignedDate: row.editor_assignedDate
            }

            if ( editor.userId != null 
                && ! dictionary[submission.id].editors.find((e) => e.userId == editor.userId) )
            {
                dictionary[submission.id].editors.push(editor)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async countJournalSubmissions(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
           SELECT 
             COUNT(DISTINCT(journal_submissions.id)) as count
            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
            ${where} 
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                page: page ? page : 1,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }

    }

    async selectJournalSubmissions(where, params) {
        where = where || ''
        params = params || []

        const sql = `
            SELECT
                ${this.getJournalSubmissionSelectionString()},


                reviews.id as review_id, reviews.version as review_version,
                reviews.recommendation as review_recommendation, reviews.user_id as "review_userId",

                journal_submission_editors.submission_id as "editor_submissionId",
                journal_submission_editors.user_id as "editor_userId",
                journal_submission_editors.created_date as "editor_assignedDate"

            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                LEFT OUTER JOIN reviews ON journal_submission_reviewers.user_id = reviews.user_id AND journal_submissions.paper_id = reviews.paper_id AND reviews.status='submitted'
                LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id

            ${where}

            ORDER BY journal_submissions.created_date desc, reviews.created_date desc
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        } else {
            return this.hydrateJournalSubmissions(results.rows)
        }
    }

    async countJournalSubmissions(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
           SELECT 
             COUNT(DISTINCT(journal_submissions.id)) as count
            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
                LEFT OUTER JOIN journals ON journal_submissions.journal_id = journals.id
            ${where} 
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                page: page ? page : 1,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }
    }

    async getPage(where, params, order, page) {
        where = (where && where.length ? where : '')
        params = (params && params.length ? [...params] : [])
        order = (order && order.length ? order : 'journal_submissions.created_date desc')  

        params.push(PAGE_SIZE)
        params.push((page-1)*PAGE_SIZE)
        const count = params.length

        const sql = `
            SELECT
                journal_submissions.id as submission_id, journal_submissions.created_date as "submission_createdDate",

            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
                LEFT OUTER JOIN journals ON journal_submissions.journal_id = journals.id
            ${where}
            GROUP BY papers.id
            ORDER BY ${order}
            LIMIT $${count-1}
            OFFSET $${count}

        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.submission_id)
    }

    async insertJournalSubmission(submission) {
        const results = await this.database.query(`
            INSERT INTO journal_submissions (journal_id, paper_id, submitter_id, submission_comment, status, created_date, updated_date)
                VALUES ($1, $2, $3, $4, 'submitted', now(), now())
                    RETURNING id
        `, [ submission.journalId, submission.paperId, submission.submitterId, submission.submission_comment ])

        if ( results.rowCount <= 0 || results.rows.length <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert Submission to Journal(${submission.journalId}) for Paper(${submission.paperId}) failed.`)
        }

        return results.rows[0].id
    }

    async updatePartialSubmission(submission) {
        const ignoredFields = [ 'id', 'journal_id', 'paper_id', 'created_date', 'updated_date' ]

        let sql = 'UPDATE journal_submissions SET '
        let params = []
        let count = 1
        for(let key in submission) {
            if (ignoredFields.includes(key) ) {
                continue
            }

            if ( key == 'submitterId' ) {
                sql += `submitter_id = $${count}, `
            } else if ( key == 'submissionComment' ) {
                sql += `submission_comment = $${count}, `
            } else if ( key == 'deciderId' ) {
                sql += `decider_id = $${count}, `
            } else if ( key == `decisionComment` ) {
                sql += `decision_comment = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }
            
            params.push(submission[key])
            count = count + 1
        }

        if ( (submission.status == 'published' || submission.status == 'rejected') && submission.decider_id ) {
            sql += `decision_date = now(), `
        }
        sql += `updated_date = now() WHERE id = $${count}`

        params.push(submission.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', 
                `Failed to update Submission(${submission.id}) to Journal(${submission.journalId}).`)
        }
    }

    async deleteSubmission(id) {
        const results = await this.database.query(`
            DELETE FROM journal_submissions WHERE id = $1
        `, [ id ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion',
                `Attempt to delete Submission(${submission.id}) failed.`)
        }
    }

    // ======= Submission Reviewer ============================================

    async insertJournalSubmissionReviewer(reviewer) {
        const results = await this.database.query(`
            INSERT INTO journal_submission_reviewers (submission_id, user_id, created_date, updated_date)
                VALUES ($1, $2, now(), now())
        `, [ reviewer.submissionId, reviewer.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert Reviewer(${reviewer.userId}) for Submission(${reviewer.submissionId}).`)
        }
    }

    async deleteJournalSubmissionReviewer(submissionId, userId) {
        const results = await this.database.query(`
            DELETE FROM journal_submission_reviewers
                WHERE submission_id = $1 AND user_id = $2
        `, [ submissionId, userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Reviewer(${userId}) for Submission(${submissionId}).`)
        }
    }

    // ======= Submission Editor ============================================

    async insertJournalSubmissionEditor(editor) {
        const results = await this.database.query(`
            INSERT INTO journal_submission_editors (submission_id, user_id, created_date, updated_date)
                VALUES ($1, $2, now(), now())
        `, [ editor.submissionId, editor.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert Editor(${reviewer.userId}) for Submission(${reviewer.submissionId}).`)
        }
    }

    async deleteJournalSubmissionEditor(submissionId, userId) {
        const results = await this.database.query(`
            DELETE FROM journal_submission_editors
                WHERE submission_id = $1 AND user_id = $2
        `, [ submissionId, userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Editor(${userId}) for Submission(${submissionId}).`)
        }
    }

}
