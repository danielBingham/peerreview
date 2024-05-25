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
    Token, 
    PartialToken, 
    TokenType, 
    DatabaseQuery, 
    DatabaseResult, 
    ModelDictionary 
} from '@danielbingham/peerreview-model'


export class TokenDAO {
    core: Core
    database: Pool | Client

    constructor(core: Core, database?: Client | Pool) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }
    }

    getTokenSelectionString(): string {
        return `
        tokens.id as "Token_id",
        tokens.user_id as "Token_userId",
        tokens.token as "Token_token",
        tokens.type as "Token_type",
        tokens.created_date as "Token_createdDate",
        tokens.updated_date as "Token_updatedDate"
        `
    }

    hydrateToken(row: QueryResultRow): Token {
        const token = {
            id: row.Token_id,
            userId: row.Token_userId,
            token: row.Token_token,
            type: row.Token_type,
            createdDate: row.Token_createdDate,
            updatedDate: row.Token_updatedDate
        }
        return token
    }

    hydrateTokens(rows: QueryResultRow[]): DatabaseResult<Token> {
        const dictionary: ModelDictionary<Token> = {}
        const list = []

        for ( const row of rows ) {
            if ( ! dictionary[row.Token_id] ) {
                dictionary[row.Token_id] = this.hydrateToken(row) 
                list.push(row.Token_id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Select Token models from the `tokens` table.
     */
    async selectTokens(query: DatabaseQuery): Promise<DatabaseResult<Token>> {
        const where = `WHERE ${query.where}` || ''
        const params = query.params || []

        const sql = `
            SELECT 
                ${this.getTokenSelectionString()}
            FROM tokens
            ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] } 
        }

        return this.hydrateTokens(results.rows)
    }

    /**
     * Create a row in the `tokens` table corresponding to a Token model.
     */
    async insertToken(token: Token): Promise<number> {
        const results = await this.database.query(`
            INSERT INTO tokens (user_id, token, type, created_date, updated_date)
                VALUES ( $1, $2, $3, now(), now())
                RETURNING id
        `, [ token.userId, token.token, token.type ])

        if ( results.rows.length <= 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert token failed.`)
        }

        return results.rows[0].id
    }

    /**
     * Delete the row corresponding to a Token model from the `tokens` table.
     */
    async deleteToken(token: Token): Promise<void> {
        const results = await this.database.query(`
            DELETE FROM tokens WHERE token=$1
        `, [ token.token ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('delete-failed', `Attempt to delete Token(${token.token}) failed.`)
        }
    }
}
