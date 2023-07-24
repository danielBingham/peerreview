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
                members: []
            }

            if ( ! dictionary[journal.id] ) {
                dictionary[journal.id] = journal
                list.push(journal)
            }

            const member = {
                userId: row.member_userId,
                permissions: row.member_permissions
            }

            if ( ! dictionary[journal.id].members.find((member) => member.userId == row.user_id) ) {
                dictionary[journal.id].members.push(member)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectJournals(where, params) {
        where = where || ''
        params = params || []

        const sql = `
            SELECT 
                journals.id as journal_id, journals.name as journal_name, journals.description as journal_description,
                journals.created_date as "journal_createdDate", journals.updated_date as "journal_updatedDate",

                journal_members.user_id as "member_userId", journal_members.permissions as member_permissions

            FROM journals
                LEFT OUTER JOIN journal_members ON journals.id = journal_members.journal_id

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

    async updateJournal(journal) {
        throw new DAOError('not-implemented', `Attempt to call updateJournal, which hasn't been implemented.`)
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

            sql += `${key} = $${count}, `
            
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

    // ======= Journal Members ================================================

    async insertJournalMember(journal, member) {
        const results = await this.database.query(`
            INSERT INTO journal_members (journal_id, user_id, permissions, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
            `, 
            [ journal.id, member.userId, member.permissions ]
        )

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', `Failed to insert JournalUser(${journalUser.userId}).`)
        }
    }

    async updateJournalMember(journal, member) {
        const results = await this.database.query(`
            UPDATE journal_members SET permissions = $1, updated_date = now()
                WHERE journal_id = $2 AND user_id = $3
        `, [ member.permissions, journal.id, member.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-update', `Failed to update Member(${member.userId}) of Journal(${journal.id}).`)
        }

    }

    async updatePartialJournalMember(journal, member) {
        throw new DAOError('not-implemented', `Attempt to call updatePartialJournalMember() which isn't implemented.`)
    }

    async deleteJournalMember(journal, member) {
        const results = await this.database.query(`
            DELETE FROM journal_users WHERE journal_id = $1 AND user_id = $2
        `, [ journal.id, member.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Member(${member.userId}) from Journal(${journal.id}).`)
        }

    }

}
