import { Pool, Client, QueryResultRow } from 'pg'

import Core from '../core'
import DAOError from '../errors/DAOError'

import { Journal, JournalMember, DatabaseResult, ModelDictionary} from '@danielbingham/peerreview-model'

const PAGE_SIZE = 20

module.exports = class JournalDAO {
    core: Core
    database: Pool|Client

    /**
     * Construct the Data Access Object with the core and an optional database
     * client.
     *
     * @param {Core} core   The core object with dependencies.
     * @param {Client} database     (Optional) A Client object from pg for use
     * with the DAO in a transaction context.
     */
    constructor(core: Core, database?: Client) {
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
     * Get the selection string for the `journals` table.  For use with
     * `hydrateJournal` to select and populate Journal model objects.
     */
    getJournalSelectionString(): string {
        return `
            journals.id as "Journal_id", 
            journals.name as "Journal_name", 
            journals.description as "Journal_description",
            ${ this.core.features.hasFeature('journal-permission-models-194') ? 'journals.model as "Journal_model", ' : '' }
            journals.created_date as "Journal_createdDate", 
            journals.updated_date as "Journal_updatedDate"
        `
    }

    hydrateJournal(row: QueryResultRow): Journal {
        const journal: Journal = {
            id: row.Journal_id,
            name: row.Journal_name,
            description: row.Journal_description,
            createdDate: row.Journal_createdDate,
            updatedDate: row.journal_updatedDate,
            members: []
        }
        if ( this.core.features.hasFeature('journal-permission-models-194') ) {
            journal.model = row.journal_model
        }
        return journal
    }

    /**
     * Get the selection string for the `journal_members` table, mapped to the
     * `JournalMember` type.
     */
    getJournalMemberSelectionString(): string {
        return `
            journal_members.journal_id as "Member_journalId",
            journal_members.user_id as "Member_userId", 
            journal_members.member_order as "Member_order",
            journal_members.permissions as "Member_permissions",
            journal_members.created_date as "Member_createdDate",
            journal_members.updated_date as "Member_updatedDate"
        `
    }

    hydrateJournalMember(row: QueryResultRow): JournalMember {
        const member: JournalMember = {
            journalId: row.Member_journalId,
            userId: row.Member_userId,
            order: row.Member_order,
            permissions: row.Member_permissions,
            createdDate: row.Member_createdDate,
            updatedDate: row.Member_updatedDate
        }

        return member
    }

    hydrateJournals(rows: QueryResultRow[]): DatabaseResult<Journal> {
        const dictionary: ModelDictionary<Journal> = {}
        const list: number[] = []

        for(const row of rows) {
            const journal = this.hydrateJournal(row) 

            if ( ! dictionary[journal.id] ) {
                dictionary[journal.id] = journal
                list.push(journal.id)
            }

            if ( row.member_userId ) {

                if ( ! dictionary[journal.id].members.find((member) => member.userId == row.user_id) ) {
                    const member = this.hydrateJournalMember(row)
                    dictionary[journal.id].members.push(member)
                }
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async countJournals(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                 COUNT(journals.id) as count
                FROM journals 
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

    async getPage(where, inputParams, order, page) {
        where = where || ''
        const params = [ ...inputParams ] || [] // Need to copy here because we're going
        // to reuse it in count.
        order = order ? order : 'journals.created_date desc'

        if ( ! page ) {
            return null 
        }

        let paging = ''
        page = page ? page : 1

        const offset = (page-1) * PAGE_SIZE
        let count = params.length 

        paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

        params.push(PAGE_SIZE)
        params.push(offset)

        const sql = `
            SELECT DISTINCT 
                journals.id, journals.name, journals.created_date
            FROM journals
                LEFT OUTER JOIN journal_members ON journals.id = journal_members.journal_id
            ${where}
            GROUP BY journals.id
            ORDER BY ${order}
            ${paging}
        `

        const results = await this.database.query(sql, params)
        if ( results.rows.length > 0 ) {
            return results.rows.map((row) => row.id)
        } else {
            return []
        }
    }

    async selectJournals(where, inputParams, order, page) {
        where = where || ''
        const params = [ ...inputParams ] || [] // Need to copy here because we're going
        // to reuse it in count.
        order = order ? order : 'journals.created_date desc'

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        if ( page ) {
            const pageIds = await this.getPage(where, params, order, page)

            if ( where.length > 0 ) {
                where += ` AND journals.id = ANY($${params.length}::bigint[])`
                params.push(pageIds)
            } else {
                where = `WHERE journals.id = ANY($1::bigint[])`
                params.push(pageIds)
            }
        }

        const sql = `
            SELECT 
                ${ this.getJournalSelectionString() }


            FROM journals
                LEFT OUTER JOIN journal_members ON journals.id = journal_members.journal_id
            ${where}
            ORDER BY ${order}
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
            INSERT INTO journals (name, description, ${ this.core.features.hasFeature('journal-permission-models-194') ? 'model, ' : ''} created_date, updated_date)
                VALUES ($1, $2, ${ this.core.features.hasFeature('journal-permission-models-194') ? '$3, ' : ''} now(), now())
                RETURNING id
        `

        const params = [ journal.name, journal.description ]

        if ( this.core.features.hasFeature('journal-permission-models-194') ) {
            params.push(journal.model)
        }

        const results = await this.database.query(sql, params)

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

    async insertJournalMember(journalId, member) {
        const results = await this.database.query(`
            INSERT INTO journal_members (journal_id, user_id, member_order, permissions, created_date, updated_date)
                VALUES ($1, $2, $3, $4, now(), now())
            `, 
            [ journalId, member.userId, member.order, member.permissions ]
        )

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', `Failed to insert JournalUser(${journalUser.userId}).`)
        }
    }

    async updateJournalMember(journalId, member) {
        const results = await this.database.query(`
            UPDATE journal_members SET permissions = $1, member_order = $2, updated_date = now()
                WHERE journal_id = $3 AND user_id = $4
        `, [ member.permissions, member.order, journalId, member.userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-update', `Failed to update Member(${member.userId}) of Journal(${journal.id}).`)
        }
    }

    async updatePartialJournalMember(journal, member) {
        throw new DAOError('not-implemented', `Attempt to call updatePartialJournalMember() which isn't implemented.`)
    }

    async deleteJournalMember(journalId, userId) {

        // Before we delete the member, we need to remove them from their assignements.
       const editorResults = await this.database.query(`
            DELETE FROM journal_submission_editors
                WHERE user_id = $1
                    AND submission_id IN (SELECT id FROM journal_submissions WHERE journal_id = $2)
        `, [ userId, journalId ])

        const reviewerResults = await this.database.query(`
            DELETE FROM journal_submission_reviewers
                WHERE user_id = $1
                    AND submission_id IN (SELECT id FROM journal_submissions WHERE journal_id = $2)
        `, [ userId, journalId ])

        const results = await this.database.query(`
            DELETE FROM journal_members WHERE journal_id = $1 AND user_id = $2
        `, [ journalId, userId ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Member(${member.userId}) from Journal(${journalId}).`)
        }
    }


}
