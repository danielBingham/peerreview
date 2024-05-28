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

import { PaperEvent, PartialPaperEvent, DatabaseQuery, ModelDictionary, DatabaseResult } from '@danielbingham/peerreview-model'

export class PaperEventDAO {
    core: Core
    database: Client | Pool

    constructor(core: Core, database?: Client | Pool) {
        this.core = core

        this.database = core.database
        if ( database) {
            this.database = database
        }
    }

    getPaperEventSelectionString(): string {
        return `
        paper_events.id as "PaperEvent_id", 
        paper_events.paper_id as "PaperEvent_paperId",
        paper_events.actor_id as "PaperEvent_actorId",
        paper_events.version as "PaperEvent_version",
        paper_events.status as "PaperEvent_status",
        paper_events.type as "PaperEvent_type",
        paper_events.visibility::text[] as "PaperEvent_visibility", 
        paper_events.PaperEvent_date as "PaperEvent_eventDate",

        paper_events.assignee_id as "PaperEvent_assigneeId", 
        paper_events.review_id as "PaperEvent_reviewId",
        paper_events.review_comment_id as "PaperEvent_reviewCommentId",
        paper_events.submission_id as "PaperEvent_submissionId", 
        paper_events.new_status as "PaperEvent_newStatus",
        paper_events.paper_comment_id as "PaperEvent_paperCommentId"
        `
    }

    hydrateEvent(row: QueryResultRow): PaperEvent {
        const event: PaperEvent = {
            id: row.PaperEvent_id,
            paperId: row.PaperEvent_paperId,
            actorId: row.PaperEvent_actorId,
            version: row.PaperEvent_version,
            status: row.PaperEvent_status,
            type: row.PaperEvent_type,
            visibility: row.PaperEvent_visibility,
            eventDate: row.PaperEvent_eventDate,

        }
       
        if ( row.PaperEvent_assigneeId ) {
            event.assigneeId = row.PaperEvent_assigneeId
        }

        if ( row.PaperEvent_reviewId ) {
            event.reviewId = row.PaperEvent_reviewId
        }

        if ( row.PaperEvent_reviewCommentId ) {
            event.reviewCommentId = row.PaperEvent_reviewCommentId
        }

        if ( row.PaperEvent_submissionId ) {
            event.submissionId = row.PaperEvent_submissionId
        }
        
        if ( row.PaperEvent_newStatus ) {
            event.newStatus = row.PaperEvent_newStatus
        }

        if ( row.PaperEvent_paperCommentId ) {
            event.paperCommentId = row.PaperEvent_paperCommentId
        }

        return event
    }

    hydrateEvents(rows: QueryResultRow[]): DatabaseResult<PaperEvent> {
        const dictionary: ModelDictionary<PaperEvent> = {}
        const list: number[] = []

        for(const row of rows) {
            const event = this.hydrateEvent(row)

            if( ! dictionary[event.id] ) {
                dictionary[event.id] = event
                list.push(event.id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectEvents(query: DatabaseQuery): Promise<DatabaseResult<PaperEvent>> {
        const where = query.where || ''
        const params = query.params || []
        const order = query.order || 'paper_events.event_date asc'

        const page = query.page || 0
        const itemsPerPage = query.itemsPerPage || 20

        let paging = ''
        if ( page > 0 ) {
            paging = `
                LIMIT ${itemsPerPage}
                OFFSET ${(page-1) * itemsPerPage}
            `
        }

        const sql = `
            SELECT 
                ${this.getPaperEventSelectionString()}
            FROM paper_events
            ${where}
            ORDER BY ${order}
            ${paging}
        `
        
        const results = await this.database.query(sql, params)

        return this.hydrateEvents(results.rows)
    }

    /**
     * Insert a new row into the `paper_events` table from a PaperEvent model.
     */
    async insertEvent(event: PaperEvent): Promise<void> {
        let columns = ``
        let values = ``
        let params = []

        const validFields = [ 
            'paperId', 'actorId', 'version', 'status', 'type', 
            'visibility', 'eventDate', 'assigneeId', 'reviewId', 
            'reviewCommentId', 'submissionId', 'newStatus', 'paperCommentId'
        ]

        let count = 1
        for(const [key, value] of Object.entries(event)) {
            if ( ! validFields.includes(key) ) {
                continue
            }
            
            if ( key == 'paperId' ) {
                columns += `paper_id, `
            } else if ( key == 'actorId' ) {
                columns += `actor_id, `
            } else if ( key == 'assigneeId' ) {
                columns += `assignee_id, `
            } else if ( key == 'reviewId' ) {
                columns += `review_id, `
            } else if ( key == 'reviewCommentId' ) {
                columns += `review_comment_id, `
            } else if ( key == 'submissionId' ) {
                columns += `submission_id, `
            } else if ( key == 'newStatus' ) {
                columns += `new_status, `
            } else if ( key == 'paperCommentId' ) {
                columns += `paper_comment_id, `
            } else {
                columns += `${key}, `
            }

            values += `$${count}, `
            params.push(value)
            count += 1
        }

        columns += `event_date`
        values += `now()`

        let sql = `INSERT INTO paper_events (${columns}) VALUES (${values})`

        const results = await this.database.query(sql, params)
        
        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert event failed.`)
        }
    }

    /**
     * Update the row in the `paper_events` table corresponding to the
     * PartialPaperEvent. PartialPaperEvent must include an id.
     */
    async updateEvent(event: PartialPaperEvent): Promise<void> {

        if ( ! event.id ) {
            throw new DAOError('missing-id', `Attempt to update PaperEvent without including the id.`)
        }

        if ( ! event.visibility && ! event.status ) {
            throw new DAOError('update-failed', `Only visibility or status may be updated.`)
        }

        if ( event.visibility ) {
            const results = await this.database.query(
                `UPDATE paper_events SET visibility = $1 WHERE id = $2`,
                [ event.visibility, event.id]
            )

            if ( ! results.rowCount || results.rowCount <= 0 ) {
                throw new DAOError('update-failure', `Attempt to update event failed.`)
            }
        }

        if ( event.status ) {
            const results = await this.database.query(
                `UPDATE paper_events SET status = $1 WHERE id = $2`,
                [ event.status, event.id]
            )

            if ( ! results.rowCount || results.rowCount <= 0 ) {
                throw new DAOError('update-failure', `Attempt to update event failed.`)
            }
        }
    }
}
