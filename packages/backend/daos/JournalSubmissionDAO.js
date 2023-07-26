
const DAOError = require('../errors/DAOError')

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
                status: row.submission_status,
                createdDate: row.submission_createdDate,
                updatedDate: row.submission_updatedDate,
                reviewers: []
            }

            if ( ! dictionary[submission.id] ) {
                dictionary[submission.id] = submission
                list.push(submission)
            }

            const reviewer = {
                userId: row.reviewer_userId,
                assignedDate: row.reviewer_assignedDate
            }

            if ( reviewer.userId !== null && ! dictionary[submission.id].reviewers.find((r) => r.userId == reviewer.userId) ) {
                dictionary[submission.id].reviewers.push(reviewer)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectJournalSubmissions(where, params) {
        where = where || ''
        params = params || []

        const sql = `
            SELECT
                journal_submissions.id as submission_id, 
                journal_submissions.journal_id as "submission_journalId",
                journal_submissions.paper_id as "submission_paperId",
                journal_submissions.status as submission_status,
                journal_submissions.created_date as "submission_createdDate",
                journal_submissions.updated_date as "submission_updatedDate",

                journal_submission_users.id as reviewer_id,
                journal_submission_users.user_id as "reviewer_userId",
                journal_submission_users.created_date as "reviewer_assignedDate"

            FROM journal_submissions
                LEFT OUTER JOIN journal_submission_users ON journal_submissions.id = journal_submission_users.submissions_id

            ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        } else {
            return this.hydrateJournalSubmissions(results.rows)
        }
    }

    async insertJournalSubmission(submission) {
        const results = await this.database.query(`
            INSERT INTO journal_submissions (journal_id, paper_id, status, created_date, updated_date)
                VALUES ($1, $2, 'submitted', now(), now())
                    RETURNING id
        `, [ submission.journalId, submission.paperId ])

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

            sql += `${key} = $${count}`
            
            params.push(submission[key])
            count = count + 1
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
            INSERT INTO journal_submission_users (submission_id, user_id, created_date, updated_date)
                VALUES ($1, $2, now(), now())
        `, [ reviewer.submissionId, reviewer.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert Reviewer(${reviewer.userId}) for Submission(${reviewer.submissionId}).`)
        }
    }

    async updatePartialJournalSubmissionReviewer(reviewer) {
        throw new DAOError('not-implemented', `Update partial submission is not implemented.`)
    }

    async deleteJournalSubmissionReviewer(reviewer) {
        const results = await this.database.query(`
            DELETE FROM journal_submission_users
                WHERE submission_id = $1 AND user_id = $2
        `, [ reviewer.submissionId, reviewer.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Reviewer(${reviewer.userId}) for Submission(${reviewer.submissionId}).`)
        }
    }


}
