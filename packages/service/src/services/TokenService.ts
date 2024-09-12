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
import crypto from 'node:crypto'

import { Core } from '@journalhub/core'

import { PartialToken, TokenType } from '@journalhub/model'
import { TokenDAO } from '@journalhub/data-access'

import { ServiceError } from '../errors/ServiceError'

const TOKEN_TTL: { [type in TokenType]: number } = {
    'email-confirmation': 1000*60*60*24, // 1 day
    'reset-password': 1000*60*30, // 30 minutes
    'invitation': 1000*60*60*24*30 // 1 month
}

export class TokenService {
  core: Core

  tokenDAO: TokenDAO

  constructor(core: Core) {
    this.core = core

    this.tokenDAO = new TokenDAO(core) 
  }

  /**
   * Creates a new token for User(userId) of type `type`.
   */
  createToken(userId: number, type: TokenType): PartialToken  {
    const buffer = crypto.randomBytes(32)
    const token = {
      token: buffer.toString('hex'),
      type: type,
      userId: userId
    }
    return token
  }

  /**
   * Validate a token against the database.  Confirms that the token exists in
   * the `tokens` table and matches the types provided in `validTypes`.
   */
  async validateToken(tokenString: string, validTypes: TokenType[]) {
    const tokenResult = await this.tokenDAO.selectTokens({ where: 'tokens.token = $1', params: [ tokenString ]})

    if ( tokenResult.list.length <= 0 ) {
      throw new ServiceError('not-found',
                         `Attempt to redeem a non-existent token.`)
    }

    const token = tokenResult.dictionary[tokenResult.list[0]]

    if ( ! validTypes.includes(token.type) ) {
      throw new ServiceError('wrong-type', 
                         `Attempt to redeem Token(${token.id}) token as a invalid type.`)
    }

    // Token lifespan.
    const createdDate = new Date(token.createdDate)
    const createdDateMs = createdDate.getTime()

    if ( (Date.now() - createdDateMs) > TOKEN_TTL[token.type]) {
      throw new ServiceError('expired',
                         `Attempt to redeem an expired token.`)
    }

    return token
  }

}
