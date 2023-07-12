const DAOError = require('../errors/DAOError')

module.exports = class JournalDAO {

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

    hydrateJournals(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const journal = {
                id: row.journal_id,
                name: row.journal_name,
                description: row.journal_description,
                createdDate: row.journal_createdDate,
                updatedDate: row.journal_updatedDate,
                editors: []
            }

            if ( ! dictionary[journal.id] ) {
                dictionary[journal.id] = journal
                list.push(journal)
            }

            const editor = {
                userId: row.user_id,
                permissions: row.user_permissions
            }

            if ( ! dictionary[journal.id].editors.find((editor) => editor.userId == row.user_id) ) {
                dictionary[journal.id].editors.push(editor)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectJournals(where, params) {
        where = where || ''

        const sql = `
            SELECT 
                journals.id as journal_id, journals.name as journal_name, journals.description as journal_description,
                journals.created_date as "journal_createdDate", journals.updated_date as "journal_updatedDate",

                journal_users.user_id as user_id, journal_users.permissions as user_permissions

            FROM journals
                LEFT OUTER JOIN journal_users ON journals.id = journal_users.journal_id

            ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] } 
        } else {
            return this.hydrateJournals(results.rows)
        }
    }

    async insertJournal(journal) {
        const sql = `
            INSERT INTO journals (name, description, created_date, updated_date)
                VALUES ($1, $2, now(), now())
                RETURNING id
        `

        const results = await this.database.query(sql, [ journal.name, journal.description ])

        if ( results.rowCount <= 0 || results.rows.length <= 0 ) {
            throw new DAOError('failed-insertion', `Attempt to insert journal "${journal.name}" failed.`)
        }

        return results.rows[0].id
    }

    async insertJournalUser(journal, journalUser) {
        const results = await this.database.query(`
            INSERT INTO journal_users (journal_id, user_id, permissions, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
            `, 
            [ journal.id, journalUser.userId, journalUser.permissions ]
        )


        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', `Failed to insert JournalUser(${journalUser.userId}).`)
        }

    }

    async updatePartialJournal(journal) {
        const ignoredFields = [ 'id', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE journals SET '
        let params = []
        let count = 1
        for(let key in journal) {
            if (ignoredFields.includes(key) ) {
                continue
            }

            sql += `${key} = $${count}`
            
            params.push(journal[key])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`

        params.push(journal.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update Journal(${journal.id}).`)
        }
    }

    async deleteJournal(journal) {
        const results = await this.database.query(
            'DELETE FROM journals WHERE id = $1',
            [ journal.id ]
        )

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', `Failed to delete Journal(${journal.id}).`)
        }
    }

}
