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
import { Core, ServiceError } from '@danielbingham/peerreview-core' 

export class SessionService {
    core: Core

    constructor(core: Core) {
        this.core = core
    }


    async getSession(userId: number): Promise<any>  {
        const results = await this.core.database.query(`
            SELECT sid, sess FROM session 
                WHERE (sess #>> '{user,id}')::bigint = $1
        `, [ userId ])

        let session = null
        if ( results.rows.length > 0 ) {
            session = {
                id: results.rows[0].sid,
                data: results.rows[0].sess
            }
        }

        return session
    }

    async setSession(session: any) {
        const results = await this.core.database.query(`
            UPDATE session SET sess = $1 WHERE sid = $2
        `, [ session.data, session.id])

        if ( results.rowCount && results.rowCount <= 0 ) {
            throw new ServiceError('update-failed', 'Failed to update session!')
        }

    }
}
