
const DAOError = require('../errors/DAOError')

const PAGE_SIZE = 20

module.exports = class JournalSubmissionDAO {

    constructor(core, database) {
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

    hydrateJournalSubmissions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const submission = {
                id: row.submission_id,
                journalId: row.submission_journalId,
                paperId: row.submission_paperId,
                submitterId: row.submission_submitterId,
                submitterComment: row.submission_submitterComment,
                status: row.submission_status,
                deciderId: row.submission_deciderId,
                decisionComment: row.submission_decisionComment,
                decisionDate: row.submission_decisionDate,
                createdDate: row.submission_createdDate,
                updatedDate: row.submission_updatedDate,
                reviewers: [],
                editors: []
            }

            if ( ! dictionary[submission.id] ) {
                dictionary[submission.id] = submission
                list.push(submission)
            }

            let reviewer = {
                userId: row.reviewer_userId,
                assignedDate: row.reviewer_assignedDate,
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
                journal_submissions.id as submission_id, 
                journal_submissions.journal_id as "submission_journalId",
                journal_submissions.paper_id as "submission_paperId",
                journal_submissions.submitter_id as "submission_submitterId",
                journal_submissions.submission_comment as "submission_submitterComment",
                journal_submissions.status as submission_status,
                journal_submissions.decider_id as "submission_deciderId",
                journal_submissions.decision_comment as "submission_decisionComment",
                journal_submissions.decision_date as "submission_decisionDate",
                journal_submissions.created_date as "submission_createdDate",
                journal_submissions.updated_date as "submission_updatedDate",

                journal_submission_reviewers.submission_id as "reviewer_submissionId",
                journal_submission_reviewers.user_id as "reviewer_userId",
                journal_submission_reviewers.created_date as "reviewer_assignedDate",

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

            ORDER BY journal_submissions.created_date desc
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
