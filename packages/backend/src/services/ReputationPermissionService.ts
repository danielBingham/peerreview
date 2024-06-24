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
import { Pool, Client } from 'pg'
import { Core, Logger, ServiceError } from '@danielbingham/peerreview-core' 
import { Paper } from '@danielbingham/peerreview-model'

const THRESHOLDS = {
    /**
     * Can review papers. Multiple of field.average_reputation 
     */
    review: 5,

    /**
     * Can exercise literature integrity control.  IE Vote/respond.
     *
     * Multiple of field.average_reputation
     */
    referee: 10,

    /**
     * Can publish.  Multiple of field.average_reputation
     */
    publish: 0
}

export class ReputationPermissionService {
    core: Core
    database: Pool | Client
    logger: Logger

    constructor(core: Core)  {
        this.core = core

        this.database = core.database
        this.logger = core.logger
    }

    async getVisibleDrafts(userId: number): Promise<number[]> {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT 
                    papers.id
                FROM papers
                    JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    JOIN fields ON paper_fields.field_id = fields.id
                    LEFT OUTER JOIN user_field_reputation ON paper_fields.field_id = user_field_reputation.field_id
                WHERE papers.is_draft = true 
                    AND ((user_field_reputation.user_id = $1 AND user_field_reputation.reputation > fields.average_reputation*${THRESHOLDS.review}) OR (paper_authors.user_id = $1) OR $2)
                GROUP BY papers.id
        `

        const results = await this.database.query(sql, [ userId, admin ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    getThresholds() {
        return THRESHOLDS
    }

    async canReview(userId: number, paperId: number): Promise<boolean> {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation >= fields.average_reputation * ${THRESHOLDS.review}
        `

        const results = await this.database.query(sql, [userId, paperId ])

        // If they have enough reputation - great!  We're done here.
        if ( results.rows.length > 0 ) {
            return true
        }
        
        const authorResults = await this.database.query( `
                SELECT user_id from paper_authors where paper_id = $1 AND user_id = $2
            `, [ paperId, userId ])

        // They are an author on the paper.  They are allowed.
        if ( authorResults.rows.length > 0 ) {
            return true
        }

        if ( admin ) {
            return true
        }

        return false
    }

    async canReferee(userId: number, paperId: number): Promise<boolean> {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE (user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation >= fields.average_reputation * ${THRESHOLDS.referee}) OR $3
        `

        const results = await this.database.query(sql, [userId, paperId, admin])

        return results.rows.length > 0
    }

    async canPublish(userId: number, paper: Paper): Promise<{ canPublish: boolean, missingFields: number[] }> {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        if ( admin ) {
            return {
                canPublish: true,
                missingFields: []
            }
        }

        const fieldIds = [ ...paper.fields ]
        const authorIds = paper.authors.map((a) => a.userId)

        // Must be an author to publish a paper.
        if ( ! authorIds.find((aid) => aid == userId) ) {
            return {
                canPublish: false,
                missingFields: [] 
            }
        }

        const fieldResults = await this.database.query('SELECT id, average_reputation FROM fields WHERE id = ANY($1::bigint[])', [ fieldIds ])
        
        const fieldReputationMap: { [id: number]: { highest_author_reputation: boolean | number, average_field_reputation: number} } = {}
        for(const row of fieldResults.rows) {
            fieldReputationMap[row['id']] = {
                highest_author_reputation: false,
                average_field_reputation: row['average_reputation']
            }
        }

        const sql = `
SELECT DISTINCT
    users.id, user_field_reputation.field_id as field_id, user_field_reputation.reputation as reputation
FROM users
    LEFT OUTER JOIN user_field_reputation ON user_field_reputation.user_id = users.id
    LEFT OUTER JOIN fields on fields.id = user_field_reputation.field_id
WHERE users.id = ANY($1::bigint[]) AND user_field_reputation.field_id = ANY($2::bigint[])
        `

        const results = await this.database.query(sql, [authorIds, fieldIds ])

        for(const row of results.rows) {
            if ( fieldReputationMap[row['field_id']].highest_author_reputation === false ) {
                fieldReputationMap[row['field_id']].highest_author_reputation = row['reputation']
            }

            if ( fieldReputationMap[row['field_id']].highest_author_reputation < row['reputation'] ) {
                fieldReputationMap[row['field_id']].highest_author_reputation = row['reputation']
            }
        }

        let canPublish = true
        const missingFields = []

        for(const fieldId of fieldIds) {
            if ( fieldReputationMap[fieldId].highest_author_reputation !== false 
                && fieldReputationMap[fieldId].highest_author_reputation as number < fieldReputationMap[fieldId].average_field_reputation * THRESHOLDS.publish ) 
            {
                missingFields.push(fieldId)
                canPublish = false
            }
        }

        return {
            canPublish: canPublish, 
            missingFields: missingFields 
        }
    }

}
