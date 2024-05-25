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

import { 
    User, 
    UserJournalMembership,
    DatabaseQuery, 
    DatabaseResult, 
    ModelDictionary 
} from '@danielbingham/peerreview-model'

import { FileDAO } from './FileDAO'

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
            bio: ( row.user_bio !== undefined ? row.user_bio : null),
            location: ( row.user_location !== undefined ? row.user_location : null), 
            institution: ( row.user_institution !== undefined ? row.user_institution : null), 
            createdDate: ( row.user_createdDate !== undefined ? row.user_createdDate : null),
            updatedDate: ( row.user_updatedDate !== undefined ? row.user_updatedDate : null),
            file: null,
            memberships: [],
            email: ( row.user_email !== undefined ? row.user_email : null),
            status: ( row.user_status !== undefined ? row.user_status : null),
            permissions: ( row.user_permissions !== undefined ? row.user_permissions : null)
        }
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows: QueryResultRow[]): DatabaseResult<User> {
        const dictionary: ModelDictionary<User> = {}
        const list: number[] = []

        // Relationships
        const memberships: { [userId: number]: { [journalId: number]: UserJournalMembership }} = {}

        for( const row of rows ) {
            const user = this.hydrateUser(row) 
            if ( row.file_id ) {
                user.file = this.fileDAO.hydrateFile(row)
            } else {
                user.file = null
            }

            if ( row.membership_journalId ) {
                if (! memberships[user.id] ) {
                    memberships[user.id] = {}
                } 
                if ( ! memberships[user.id][row.membership_journalId] ){
                    const membership = {
                        journalId: (row.membership_journalId !== undefined ? row.membership_journalId : null),
                        permissions: (row.membership_permissions !== undefined ? row.membership_permissions: null),
                        createdDate: (row.membership_createdDate !== undefined ? row.membership_createdDate : null),
                        updatedDate: (row.membership_updatedDate !== undefined ? row.membership_updatedDate : null)
                    }

                    memberships[user.id][membership.journalId] = membership
                }
            }

            if ( ! dictionary[row.user_id] ) {
                dictionary[user.id] = user
                list.push(user.id)
            }
        }

        for(const id of list ) {
            if ( memberships[id] ) {
                dictionary[id].memberships = Object.values(memberships[id])
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
    async selectCleanUsers(where, params, order, page) {
        return await this.selectUsers(where, params, order, page, true)
    }

    /**
     * Retrieve user records from the database.
     *
     */
    async selectUsers(where, params, order, page, clean) {
        params = params ? params : []
        where = where ? where : ''
        order = order ? order : 'users.created_date desc'

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( page ) {
            page = page ? page : 1
            
            const offset = (page-1) * PAGE_SIZE
            let count = params.length 

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(PAGE_SIZE)
            params.push(offset)
        }

        const sql = `
                SELECT 
                    ${ clean === true ? this.cleanSelectionString : this.selectionString},

                    ${this.fileDAO.getFilesSelectionString()}${ this.core.features.hasFeature('journals-79') ? `, journal_members.journal_id as "membership_journalId",
                    journal_members.permissions as "membership_permissions",
                    journal_members.created_date as "membership_createdDate",
                    journal_members.updated_date as "membership_updatedDate"` : '' }

                FROM users
                    LEFT OUTER JOIN files ON files.id = users.file_id
                    ${ this.core.features.hasFeature('journals-79') ? `LEFT OUTER JOIN journal_members on journal_members.user_id = users.id` : '' }
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydrateUsers(results.rows, (clean === true))
    }

    async countUsers(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                 COUNT(users.id) as count
                FROM users 
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

    async insertUser(user) {
        if ( ! user.name ) {
            throw new DAOError('name-missing', `Attempt to create a user with out a name.`)
        }

        if ( ! user.email ) {
            throw new DAOError('email-missing', `Attempt to create a user without an email.`)
        }

        user.status = user.status ? user.status : 'unconfirmed'
        user.password = user.password ? user.password : null
        user.institution = user.institution ? user.institution : null

        const results = await this.database.query(`
                    INSERT INTO users (name, email, status, institution, password, created_date, updated_date) 
                        VALUES ($1, $2, $3, $4, $5, now(), now()) 
                        RETURNING id

                `, 
            [ user.name, user.email, user.status, user.institution, user.password ]
        )

        if ( results.rowCount == 0 ) {
            throw new DAOError('insertion-failure', `Attempt to insert new user(${user.name}) failed.`)
        }
        return results.rows[0].id
    }

    async updatePartialUser(user) {
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

            params.push(user[key])
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
