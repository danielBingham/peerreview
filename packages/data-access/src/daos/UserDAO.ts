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

import { Core, DAOError } from '@journalhub/core'

import { 
    User, 
    PartialUser,
    UserJournalMembership,
    UserStatus,
    QueryMeta,
    ModelDictionary 
} from '@journalhub/model'

import { DAOQuery, DAOQueryOrder, DAOResult } from '../types/DAO'

import { FileDAO } from './FileDAO'

const PAGE_SIZE = 20

export class UserDAO {
    core: Core
    database: Client | Pool

    fileDAO: FileDAO

    constructor(core: Core, database?: Client | Pool) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }

        this.fileDAO = new FileDAO(core)
    }

    getUserSelectionString(clean?: boolean): string {
        return `
        users.id as "User_id", 
        users.orcid_id as "User_orcidId", 
        users.file_id as "User_fileId",
        ${ ! clean ? 'users.status as "User_status"' : ''}, 
        ${ ! clean ? 'users.permissions as "User_permissions"' : ''},
        users.name as "User_name", 
        ${ ! clean ? 'users.email as "User_email"' : ''}, 
        users.bio as "User_bio", 
        users.location as "User_location", 
        users.institution as "User_institution", 
        users.created_date as "User_createdDate", 
        users.updated_date as "User_updatedDate"
        `
    }

    hydrateUser(row: QueryResultRow): User {
        return {
            id: ( row.user_id !== undefined ? row.user_id : null),
            orcidId: ( row.user_orcidId !== undefined ? row.user_orcidId : null),
            name: ( row.user_name !== undefined ? row.user_name : null),
            email: ( row.user_email !== undefined ? row.user_email : null),
            status: ( row.user_status !== undefined ? row.user_status : null),
            bio: ( row.user_bio !== undefined ? row.user_bio : null),
            location: ( row.user_location !== undefined ? row.user_location : null), 
            institution: ( row.user_institution !== undefined ? row.user_institution : null), 
            permissions: ( row.user_permissions !== undefined ? row.user_permissions : null),
            createdDate: ( row.user_createdDate !== undefined ? row.user_createdDate : null),
            updatedDate: ( row.user_updatedDate !== undefined ? row.user_updatedDate : null),
            file: null,
            memberships: []
        }
    }

    getUserJournalMembershipSelectionString(): string {
        return `
        journal_members.journal_id as "UserJournalMembership_journalId",
        journal_members.permissions as "UserJournalMembership_permissions",
        journal_members.created_date as "UserJournalMembership_createdDate",
        journal_members.updated_date as "UserJournalMembership_updatedDate"
        `
    }

    hydrateUserJournalMembership(row: QueryResultRow): UserJournalMembership {
        const membership = {
            journalId: (row.UserJournalMembership_journalId !== undefined ? row.UserJournalMembership_journalId : null),
            permissions: (row.UserJournalMembership_permissions !== undefined ? row.UserJournalMembership_permissions: null),
            createdDate: (row.UserJournalMembership_createdDate !== undefined ? row.UserJournalMembership_createdDate : null),
            updatedDate: (row.UserJournalMembership_updatedDate !== undefined ? row.UserJournalMembership_updatedDate : null)
        }
        return membership
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows: QueryResultRow[]): DAOResult<User> {
        const dictionary: ModelDictionary<User> = {}
        const list: number[] = []

        // Relationships
        const memberships: { [userId: number]: { [journalId: number]: UserJournalMembership }} = {}

        for( const row of rows ) {

            if ( ! ( row.User_id in dictionary)) {
                const user = this.hydrateUser(row) 
                if ( row.User_fileId ) {
                    user.file = this.fileDAO.hydrateFile(row)
                } else {
                    user.file = null
                }

                dictionary[user.id] = user
                list.push(user.id)
                memberships[user.id] = {}
            }

            if ( row.UserJournalMembership_journalId && ! ( row.UserJournalMembership_journalId in memberships[row.User_id])) {
                const membership = this.hydrateUserJournalMembership(row)
                memberships[row.User_id][row.UserJournalMembership_journalId] = membership
                dictionary[row.User_id].memberships.push(membership)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Get users with any sensitive data cleaned out of the record.  This
     * method should be used any time we plan to return the users from the
     * backend.
     *
     * @see this.selectUsers()
     */
    async selectCleanUsers(query: DAOQuery) {
        return await this.selectUsers(query, true)
    }

    /**
     * Retrieve user records from the database.
     *
     * TODO Fix paging.
     */
    async selectUsers(query?: DAOQuery, clean?: boolean) {
        let where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : []

        let order = 'users.created_date desc'
        if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'users.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Oldest ) {
            order = 'users.created_date asc'
        } else if ( query?.order == DAOQueryOrder.Override ) {
            if ( query.orderOverride ) {
                order = query.orderOverride 
            } else {
                throw new DAOError('missing-order-override', 'No orderOverride set for query with order set to Override.')
            }
        } 

        const page = query?.page || 0
        if ( page > 0) {
            const pageIds = await this.getPage(query)
            if ( where === '' ) {
                where = `WHERE users.id = ANY(${params.length+1}::bigint[])`
                params.push(pageIds)
            } else {
                where = `AND users.id = ANY(${params.length+1}::bigint[])`
                params.push(pageIds)
            }
        }

        const sql = `
                SELECT 
                    ${this.getUserSelectionString(clean)},

                    ${this.fileDAO.getFilesSelectionString()},

                    ${ this.core.features.hasFeature('journals-79') ? this.getUserJournalMembershipSelectionString() : '' }

                FROM users
                    LEFT OUTER JOIN files ON files.id = users.file_id
                    ${ this.core.features.hasFeature('journals-79') ? `LEFT OUTER JOIN journal_members on journal_members.user_id = users.id` : '' }
                ${where} 
                ORDER BY ${order} 
        `

        const results = await this.database.query(sql, params)
        return this.hydrateUsers(results.rows)
    }

    async getPage(query?: DAOQuery): Promise<number[]> {
        const where = query?.where ? `WHERE ${query.where}` : ''
        const params = query?.params ? [ ...query.params ] : []

        let order = 'users.created_date desc'
        if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'users.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Oldest ) {
            order = 'users.created_date asc'
        }

        const page = query?.page || 0
        const itemsPerPage = query?.itemsPerPage || PAGE_SIZE

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( page > 0) {
            const offset = (page-1) * itemsPerPage 
            let count = params.length 

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(itemsPerPage)
            params.push(offset)
        }

        const sql = `
                SELECT DISTINCT
                    users.id, users.created_date
                FROM users
                    LEFT OUTER JOIN files ON files.id = users.file_id
                    ${ this.core.features.hasFeature('journals-79') ? `LEFT OUTER JOIN journal_members on journal_members.user_id = users.id` : '' }
                ${where} 
                GROUP BY users.id
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return results.rows.map((r) => r.id)
    }

    async countUsers(query: DAOQuery): Promise<QueryMeta> {
        const where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? query.params : []
        const order = query.order ? query.order : 'users.created_date desc'

        const page = query.page || 0
        const itemsPerPage = query.itemsPerPage || PAGE_SIZE

        const sql = `
               SELECT DISTINCT ON (users.id)
                 COUNT(users.id) as count
                FROM users 
                    LEFT OUTER JOIN files ON files.id = users.file_id
                    ${ this.core.features.hasFeature('journals-79') ? `LEFT OUTER JOIN journal_members on journal_members.user_id = users.id` : '' }
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
            numberOfPages: Math.floor(count / itemsPerPage) + ( count % itemsPerPage> 0 ? 1 : 0) 
        }
    }

    async insertUser(user: PartialUser): Promise<number> {
        if ( ! ( 'name' in user) || ! user.name) {
            throw new DAOError('name-missing', `Attempt to create a user with out a name.`)
        }

        if ( ! ( 'email' in user) || ! user.email ) {
            throw new DAOError('email-missing', `Attempt to create a user without an email.`)
        }

        user.status = user.status ? user.status : UserStatus.Unconfirmed 
        user.password = user.password ? user.password : null

        const results = await this.database.query(`
            INSERT INTO users 
                (name, email, status, institution, password, created_date, updated_date) 
                VALUES 
                    ($1, $2, $3, $4, $5, now(), now()) 
                RETURNING id

                `, 
            [ user.name, user.email, user.status, user.institution, user.password ]
        )

        if ( ! results.rowCount || results.rowCount == 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert new user(${user.name}) failed.`)
        }
        return results.rows[0].id
    }

    async updatePartialUser(user: PartialUser): Promise<void> {
        let sql = 'UPDATE users SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'blindId', 'reputation', 'createdDate', 'updatedDate', 'fields']
        for(let key in user) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'orcidId') {
                sql += `orcid_id = $${count}, `
            } else if ( key == 'fileId' ) {
                sql += `file_id = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }

            params.push(user[key as keyof PartialUser])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(user.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failure', `Attempt to update user(${user.id}) failed!`)
        }
    }
}
