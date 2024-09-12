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
import bcrypt from 'bcrypt'
import { Client, Pool } from 'pg'

import { Core } from '@journalhub/core' 
import { User } from '@journalhub/model'
import { UserDAO } from '@journalhub/data-access'

import { ServiceError } from '../errors/ServiceError'

export interface Credentials {
    email: string
    password: string
}

export class AuthenticationService {
    core: Core
    database: Client | Pool

    userDAO: UserDAO

    constructor(core: Core, database?: Client | Pool) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }

        this.userDAO = new UserDAO(core, database)
    }

    /**
     * Returns a promise that will resolve with the completed hash.
     */
    hashPassword(password: string): string {
        return bcrypt.hashSync(password, 10)
    }

    /**
     * Returns a promise that will resolve with `true` or `false` depending on
     * whether they match.
     */
    checkPassword(password: string, hash: string): boolean {
        return bcrypt.compareSync(password, hash)
    }

    /**
     *
     */
    async loginUser(id: number): Promise<User> {
        const results = await this.userDAO.selectUsers({ where: 'users.id=$1', params: [id] })
        if ( results.list.length <= 0) {
            throw new ServiceError('no-user', 'Failed to get full record for authenticated user!')
        } 

        this.core.session.update({ user: results.dictionary[id] })

        return results.dictionary[id]
    }

    async authenticateUser(credentials: Credentials): Promise<number> {
        /*************************************************************
         * To authenticate the user we need to check the following things:
         *
         * 1. Their email is attached to a user record in the database.
         * 2. Their email is only attached to one user record in the database.
         * 3. They have a password set. (If they don't, they authenticated with
         * ORCID iD and cannot authenticate with this endpoint.)
         * 4. The submitted credentials include a password.
         * 5. The passwords match.
         * 
         * **********************************************************/
        const results = await this.database.query(
            'select id, password from users where email = $1',
            [ credentials.email ]
        )

        // 1. Their email is attached to a user record in the database.
        if ( results.rows.length <= 0) {
            throw new ServiceError('no-user', `No users exist with email ${credentials.email}.`)
        }

        // 2. Their email is only attached to one user record in the database.
        if (results.rows.length > 1 ) {
            throw new ServiceError('multiple-users', `Multiple users found for email ${credentials.email}.`)
        }

        // 3. They have a password set. (If they don't, they authenticated with
        // ORCID iD and cannot authenticate with this endpoint.)
        if ( ! results.rows[0].password || results.rows[0].password.trim().length <= 0) {
            throw new ServiceError('no-user-password', `User(${credentials.email}) doesn't have a password set.`)
        }

        // 4. The submitted credentials include a password.
        if ( ! credentials.password || credentials.password.trim().length <= 0 ) {
            throw new ServiceError('no-credential-password', `User(${credentials.email}) attempted to login with no password.`)
        }

        // 5. The passwords match.
        const userMatch = results.rows[0]
        const passwords_match = this.checkPassword(credentials.password, userMatch.password)
        if (! passwords_match) {
            throw new ServiceError('authentication-failed', `Failed login for email ${credentials.email}.`)
        }

        
        return userMatch.id 
    }

    async connectOrcid(userId: number, orcidId: string): Promise<{ user: User, type: string}> {
        const user = {
            id: userId,
            orcidId: orcidId
        }
        await this.userDAO.updatePartialUser(user)

        const fullUser = await this.loginUser(userId)
        return {
            type: "connection",
            user: fullUser
        }
    }
}
