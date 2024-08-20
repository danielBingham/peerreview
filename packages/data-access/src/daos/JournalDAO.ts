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

import { Core } from '@journalhub/core'

import { Journal, PartialJournal, JournalMember, ModelDictionary} from '@journalhub/model'

import { DAOError } from '../errors/DAOError'
import { DAOQuery, DAOQueryOrder, DAOResult, PageMeta } from '../types/DAO'

const PAGE_SIZE = 20

/**
 * Data Access Object for mapping the `journals` and `journal_members` tables
 * to the `Journal` model.
 */
export class JournalDAO {
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
     *
     * @return {string}     The portion of an SQL `SELECT` statement selecting
     * fields from the `journals` table and mapping them to the `Journal`
     * model.
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

    /**
     * Hydrate a single Journal model from a QueryResultRow. The query result
     * row must contain the results of the selection string returned by
     * `getJournalSelectionString()`, but can contain other data (which will be
     * ignored).
     *
     * @param {QueryResultRow} row  The row resulting from a call to a `SELECT`
     * query executed by `Pool.query()` containing the select string returned
     * by `getJournalSelectionString()`.
     *
     * @return {Journal} The populated Journal model.
     */
    hydrateJournal(row: QueryResultRow): Journal {
        const journal: Journal = {
            id: row.Journal_id,
            name: row.Journal_name,
            description: row.Journal_description,
            createdDate: row.Journal_createdDate,
            updatedDate: row.Journal_updatedDate,
            members: []
        }
        if ( this.core.features.hasFeature('journal-permission-models-194') ) {
            journal.model = row.Journal_model
        }
        return journal
    }

    /**
     * Get the selection string for the `journal_members` table, mapped to the
     * `JournalMember` type.
     *
     * @return {string}     The portion of an SQL `SELECT` statement selecting
     * fields from the `journal_members` table and mapping them to the
     * JournalMember type.
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

    /**
     * Populate a JournalMember object from an instance of pg's QueryResultRow.
     * The result row must contain the results of a `SELECT` statement that
     * included the selection string returned by
     * `getJournalMemberSelectionString()`.  It may include other results,
     * which will be ignored.
     *
     * @param {QueryResultRow}  row     A QueryResultRow containing results
     * selected using `getJournalMemberSelectionString()`.
     *
     * @return {JournalMember}  A populated JournalMember object.
     */
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

    /**
     * Hydrate multiple Journal models from an array of `QueryResultRow`
     * returned by pg's Pool.
     *
     * @param {QueryResultRow[]} rows    The array of QueryResultRow containing
     * the results of `getJournalSelectionString()` and
     * `getJournalMemberSelectionString()`.
     *
     * @return {DAOResult<Journal>} A DAOResult populated with
     * hydrated Journal models.
     */
    hydrateJournals(rows: QueryResultRow[]): DAOResult<Journal> {
        const dictionary: ModelDictionary<Journal> = {}
        const list: number[] = []

        const memberDictionary: { [journalId: number]: { [userId: number]: JournalMember }} = {}

        for(const row of rows) {
            if ( ! ( row.Journal_id in dictionary) ) {
                dictionary[row.Journal_id] = this.hydrateJournal(row) 
                list.push(row.Journal_id)
            }

            if ( row.Member_userId ) {
                if ( ! ( row.Journal_id in memberDictionary) ) {
                    memberDictionary[row.Journal_id] = {}
                }

                if ( ! ( row.Member_userId in memberDictionary[row.Journal_id])) {
                    const member = this.hydrateJournalMember(row)
                    dictionary[row.Journal_id].members.push(member)
                }
            }
        }

        return { dictionary: dictionary, list: list }
    }

    /**
     * Select Journal models from the database `journals` and `journal_members`
     * tables.
     */
    async selectJournals(query?: DAOQuery): Promise<DAOResult<Journal>> {
        let where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : [] // Need to copy here because we're going to reuse it in count.

        let order = 'journals.created_date desc'
        if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'journals.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Oldest ) {
            order = 'journals.created_date asc'
        }

        const page = query?.page || 0
        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        if ( page > 0 ) {
            const pageIds = await this.getJournalIdsForPage(query)

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
                ${ this.getJournalSelectionString() },
                ${ this.getJournalMemberSelectionString() }
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

    /**
     * Get an array of `Journal.id` that correspond the page of a query
     * identified by `pageNumber`.
     */
    async getJournalIdsForPage(query?: DAOQuery): Promise<number[]> {
        let where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : [] 

        let order = 'journals.created_date desc'
        if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'journals.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Oldest ) {
            order = 'journals.created_date asc'
        }

        const page = query?.page || 1
        const itemsPerPage = query?.itemsPerPage || PAGE_SIZE

        let paging = ''

        const offset = (page-1) * itemsPerPage 
        let count = params.length 

        paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

        params.push(itemsPerPage)
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

    /**
     * Get the paging metadata for the query defined by the given
     * `whereStatement` and `whereParams`.  
     */
    async getJournalPageMeta(query?: DAOQuery): Promise<PageMeta> {
        let where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : [] 

        const page = query?.page || 0
        const itemsPerPage = query?.itemsPerPage || PAGE_SIZE

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
                page: page,
                pageSize: itemsPerPage,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page,
            pageSize: itemsPerPage,
            numberOfPages: Math.floor(count / itemsPerPage) + ( count % itemsPerPage > 0 ? 1 : 0) 
        }
    }

    /**
     * Insert a journal defined by a Journal model into the `journals` table.
     *
     * @param {Journal}     journal     The journal to insert into the `journals` table.
     *
     * @throws {DAOError}   When something goes awry with the `INSERT` query.
     *
     * @return {Promise<void>}
     */
    async insertJournal(journal: Journal): Promise<number> {
        const sql = `
        INSERT INTO journals (
            name, 
            description, 
            ${ this.core.features.hasFeature('journal-permission-models-194') ? 'model, ' : ''} 
            created_date, 
            updated_date
        )
        VALUES (
            $1, 
            $2, 
            ${ this.core.features.hasFeature('journal-permission-models-194') ? '$3, ' : ''}
            now(), 
            now()
        )
        RETURNING id
        `

        const params = [ journal.name, journal.description ]

        if ( this.core.features.hasFeature('journal-permission-models-194')) {
            if ( journal.model ) {
                params.push(journal.model)
            }
        }

        const results = await this.database.query(sql, params)

        if ( ! results.rowCount || results.rowCount <= 0 || results.rows.length <= 0 ) {
            throw new DAOError('failed-insertion', 
                `Attempt to insert journal "${journal.name}" failed.`)
        }

        return results.rows[0].id
    }

    /**
     * Update a row in the `journals` table based on a PartialJournal model.
     *
     * @param {PartialJournal} journal  The PartialJournal with the data we
     * want to update in the `journals` table.
     *
     * @return {Promise<void>}
     */
    async updatePartialJournal(journal: PartialJournal): Promise<void> {
        let sql = 'UPDATE journals SET '
        let params = []
        let count = 1
        for(let key of Object.keys(journal)) {
            if ( key == 'id' || key == 'name') {
                continue
            }

            sql += `${key} = $${count}, `
            
            params.push(journal[key as keyof PartialJournal])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`

        params.push(journal.id)

        const results = await this.database.query(sql, params)

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update Journal(${journal.id}).`)
        }
    }

    /**
     * Delete a row from the `journals` table using it's `id`.
     *
     * @param {number} id   The id of a `Journal` model, matching the primary
     * key of the `journals` table.
     *
     * @return {Promise<void>}
     */
    async deleteJournal(id: number): Promise<void> {
        const results = await this.database.query(
            'DELETE FROM journals WHERE id = $1',
            [ id ]
        )

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', `Failed to delete Journal(${id}).`)
        }
    }

    // ======= Journal Members ================================================

    /**
     * Insert a row into the `journal_members` table from a `JournalMember`
     * model.
     *
     * @param {number} journalId    The `Journal.id` of the journal the
     * `JournalMember` belongs to.
     * @param {JournalMember} member    The `JournalMember` we want to insert
     * into the `journal_members` table.
     *
     * @return {Promise<void>}
     */
    async insertJournalMember(journalId: number, member: JournalMember): Promise<void> {
        const results = await this.database.query(`
            INSERT INTO journal_members (journal_id, user_id, member_order, permissions, created_date, updated_date)
                VALUES ($1, $2, $3, $4, now(), now())
            `, 
            [ journalId, member.userId, member.order, member.permissions ]
        )

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('failed-insertion', `Failed to insert JournalUser(${member.userId}).`)
        }
    }

    /**
     * Update the row in the `journal_members` table associated with a
     * particular JournalMember. 
     *
     * @param {number} journalId    The id of the journal the member belongs
     * to.
     * @param {JournalMember} member    The JournalMember we'd like to use to
     * update the row in the database.
     *
     * @returns {Promise<void>}
     */
    async updateJournalMember(journalId: number, member: JournalMember): Promise<void> {
        const results = await this.database.query(`
            UPDATE journal_members SET permissions = $1, member_order = $2, updated_date = now()
                WHERE journal_id = $3 AND user_id = $4
        `, [ member.permissions, member.order, journalId, member.userId ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('failed-update', `Failed to update Member(${member.userId}) of Journal(${journalId}).`)
        }
    }

    /**
     * Unimplemented.
     */
    async updatePartialJournalMember(journalId: number, member: JournalMember): Promise<void> {
        throw new DAOError('not-implemented', `Attempt to call updatePartialJournalMember() which isn't implemented.`)
    }

    /**
     * Delete a JournalMember from a Journal by deleting the row from the
     * `journal_members` table beloning to User(userId).
     *
     * @param {number} journalId   The id of the Journal the member belongs to. 
     * @param {number} userId       The id of the User to remove from the
     * Journal's membership.
     *
     * @returns {Promise<void>}
     */
    async deleteJournalMember(journalId: number, userId: number): Promise<void> {

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

        // No we can delete the member.
        const results = await this.database.query(`
            DELETE FROM journal_members WHERE journal_id = $1 AND user_id = $2
        `, [ journalId, userId ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('failed-deletion', 
                `Failed to delete Member(${userId}) from Journal(${journalId}).`)
        }
    }
}
