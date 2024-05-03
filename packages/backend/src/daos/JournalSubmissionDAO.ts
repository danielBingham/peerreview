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
import { Pool, QueryResultRow } from 'pg'

import { Core, DAOError } from '@danielbingham/peerreview-core'
import { 
    JournalSubmission,
    PartialJournalSubmission,
    JournalSubmissionReviewer,
    JournalSubmissionReview,
    JournalSubmissionEditor,
    ModelDictionary,
    DatabaseResult,
    QueryMeta
} from '@danielbingham/peerreview-model'

const PAGE_SIZE = 20

/**
 * Data Access Object for the `journal_submissions`,
 * `journal_submission_reviewers`, `journal_submission_editors` tables and
 * associated types: JournalSubmission, JournalSubmissionReviewer,
 * JournalSubmissionEditor.
 */ 
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
            journal_submissions.status as "JournalSubmission_status",
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
            status: row.JournalSubmission_status,
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
        journal_submission_reviewers.created_date as "JournalSubmissionReviewer_assignedDate"
        `
    }

    /**
     * Hydrate a single JournalSubmissionReviewer from a QueryResultRow
     * containing results selected using
    * `getJournalSubmissionReviewerSelectionString()`.
    *
    * @param {QueryResultRow} row   The QueryResultRow containing the results
    * selected using `getJournalSubmissionReviewerSelectionString()`.
    *
    * @return {JournalSubmissionReviewer}
     */
    hydrateJournalSubmissionReviewer(row: QueryResultRow): JournalSubmissionReviewer {
        return {
            userId: row.JournalSubmissionReviewer_userId,
            assignedDate: row.JournalSubmissionReviewer_assignedDate,
            reviews: []
        }
    }

    /**
     * Field component of an SQL SELECT statement for selecting the fields
     * matching the JournalSubmissionReview type.
     *
     * @Return {string} The SQL SELECT statement's field component.
     */
    getJournalSubmissionReviewSelectionString(): string {
        return `
        reviews.id as JournalSubmissionReview_id, 
        reviews.version as JournalSubmissionReview_version,
        reviews.recommendation as JournalSubmissionReview_recommendation, 
        reviews.user_id as "JournalSubmissionReview_userId"
        `
    }

    /**
     * Hydrate a `JournalSubmissionReview` object from a `QueryResultRow`
     * generated using `getJournalSubmissionReviewSelectionString()`.  Ignores
     * any other fields in the result.
     *
     * @param {QueryResultRow} row  The QueryResultRow generated using
     * `getJournalSubmissionReviewSelectionString()`.
     *
     * @return {JournalSubmissionReview}    A hydrated `JournalSubmissionReview` object.
     */
    hydrateJournalSubmissionReview(row: QueryResultRow): JournalSubmissionReview {
        return {
            id: row.JournalSubmissionReview_id,
            version: row.JournalSubmissionReview_version,
            recommendation: row.JournalSubmissionReview_recommendation,
            userId: row.JournalSubmissionReview_userId
        }

    }

    /**
     * Field component of an SQL SELECT statement for selecting the fields
     * matching the JournalSubmissionEditor type.
     *
     * @Return {string} The SQL SELECT statement's field component.
     */
    getJournalSubmissionEditorSelectionString(): string {
        return `
        journal_submission_editors.submission_id as "JournalSubmissionEditor_submissionId",
        journal_submission_editors.user_id as "JournalSubmissionEditor_userId",
        journal_submission_editors.created_date as "JournalSubmissionEditor_assignedDate"
        `

    }

    /**
     * Hydrate a `JournalSubmissionEditor` object from a `QueryResultRow`
     * generated using `getJournalSubmissionEditorSelectionString()`. Ignores
     * any other fields in the result.
     *
     * @param {QueryResultRow} row  The QueryResultRow generated using
     * `getJournalSubmissionEditorSelectionString()`.
     *
     * @return {JournalSubmissionEditor}    A hydrated
     * `JournalSubmissionEditor` object.
     */
    hydrateJournalSubmissionEditor(row: QueryResultRow): JournalSubmissionEditor {
        return {
            userId: row.JournalSubmissionEditor_userId,
            assignedDate: row.JournalSubmissionEditor_assignedDate
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

        const reviewerDictionary: { [userId: number]: JournalSubmissionReviewer } = {}
        const reviewDictionary: { [id: number]: JournalSubmissionReview } = {}
        const editorDictionary: { [userId: number]: JournalSubmissionEditor } = {}

        for(const row of rows) {
            if ( ! (row.JournalSubmission_id in dictionary)) {
                dictionary[row.JournalSubmission_id] = this.hydrateJournalSubmission(row)
                list.push(row.JournalSubmission_id)
            }

            if ( ! ( row.JournalSubmissionReviewer_userId in reviewerDictionary)) {
                const reviewer = this.hydrateJournalSubmissionReviewer(row) 
                reviewerDictionary[row.JournalSubmissionReviewer_userId] = reviewer 
                dictionary[row.JournalSubmission_id].reviewers.push(reviewer)
            }
            
            if ( ! ( row.JournalSubmissionReview_id in reviewDictionary)) {
                const review = this.hydrateJournalSubmissionReview(row)
                reviewDictionary[row.JournalSubmissionReview_id] = review
                reviewerDictionary[row.JournalSubmissionReviewer_userId].reviews.push(review)
            }

            if ( ! ( row.JournalSubmissionEditor_userId in editorDictionary)) {
                const editor = this.hydrateJournalSubmissionEditor(row)
                editorDictionary[row.JournalSubmissionEditor_userId] = editor
                dictionary[row.JournalSubmission_id].editors.push(editor)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    /**
     * Select `JournalSubmission` models from the database using any SQL WHERE
     * statement, parameterized for use with pg's `Pool.query()`.
     *
     * @param {string} where    (Optional) The WHERE portion of an SQL SELECT
     * statement, parameterized for use with pg's `Pool.query()`.
     * @param {any[]} params    (Optional) Parameters for use with the `where` query.
     *
     * @return {Promise<DatabaseResult<JournalSubmission>>} A promise that
     * resolves to a DatabaseResult populated with the hydrated
     * JounalSubmissions that result from the query.
     */
    async selectJournalSubmissions(where?: string, params?: any[]): Promise<DatabaseResult<JournalSubmission>> {
        where = where || ''
        params = params || []

        const sql = `
            SELECT
                ${this.getJournalSubmissionSelectionString()},
                ${this.getJournalSubmissionReviewerSelectionString()},
                ${this.getJournalSubmissionReviewSelectionString()},
                ${this.getJournalSubmissionEditorSelectionString()}
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

    /**
     * Generate paging metadata for the given JournalSubmissions query.
     *
     * @param {string} where    (Optional) The WHERE portion of an SQL SELECT
     * statement. Parameterized for use with pg's `Pool.query()`.
     * @param {any[]} params    (Optional) An array of parameters to use with
     * the `where` statement.
     * @param {number} page     (Optional) The page to pull.
     *
     * @return {Promise<QueryMeta>} A promise that resolves with the QueryMeta
     * data for the query defined by the parameters (paging metadata).
      */
    async getJournalSubmissionQueryMeta(where: string, params: any[], page: number): Promise<QueryMeta> {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
           SELECT 
             COUNT(DISTINCT(journal_submissions.id)) as count
            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
                LEFT OUTER JOIN reviews ON journal_submission_reviewers.user_id = reviews.user_id AND journal_submissions.paper_id = reviews.paper_id AND reviews.status='submitted'
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

        const count = parseInt(results.rows[0].count)
        return {
            count: count,
            page: page ? page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: Math.floor(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }

    }


    /**
     * Get an array of JournalSubmission.id that represents the requested page
     * of the defined query.
     *
     * @param {string} where    (Optional) The WHERE portion of an SQL SELECT query.
     * @param {any[]} params    (Optional) Parameters for use with the parameterized `where` query.
     * @param {string} order    (Optional) The ORDER portion of an SQL SELECT query.
     * @param {number} page     (Optional) The page number of the page we want to retrieve.
     *
     * @return {Promise<number[]>} A promise that resolves to an array of id
     * numbers defining which JournalSubmissions are on the requested page of
     * the query defined by `where`, `params`, and `order`.
     */
    async getPage(where?: string, params?: any[], order?: string, page?: number): Promise<number[]> {
        where = (where && where.length ? where : '')
        params = (params && params.length ? [...params] : [])
        order = (order && order.length ? order : 'journal_submissions.created_date desc')
        page = (page || 1)

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

    /**
     * Translate a single JournalSubmission into a row in the
     * `journal_submissions` table an insert it as a new row.
     *
     * @param {JournalSubmission} submission    A populated JournalSubmission.
     *
     * @return {Promise<number>} A promise that resolves to the id of the newly
     * inserted JournalSubmission.
     */
    async insertJournalSubmission(submission: PartialJournalSubmission): Promise<number> {
        if (  ! ('journalId' in submission) 
            || ! ('submitterId' in submission) 
            || ! ('paperId' in submission)
        ) {
            throw new DAOError('missing-field',
                               `Attempt to insert submission with out required field.`)
        }

        const results = await this.database.query(`
            INSERT INTO journal_submissions (journal_id, paper_id, submitter_id, status, created_date, updated_date)
                VALUES ($1, $2, $3, 'submitted', now(), now())
                    RETURNING id
        `, [ submission.journalId, submission.paperId, submission.submitterId ])

        if ( ( results.rowCount && results.rowCount <= 0) || results.rows.length <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert Submission to Journal(${submission.journalId}) for Paper(${submission.paperId}) failed.`)
        }

        return results.rows[0].id
    }

    async updatePartialSubmission(submission: PartialJournalSubmission): Promise<void> {
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
