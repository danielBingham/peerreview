const DAOError = require('../errors/DAOError')

module.exports = class PaperEventsDAO {

    constructor(core, databaseOverride) {
        this.core = core

        this.database = core.database
        if ( databaseOverride ) {
            this.database = databaseOverride
        }
    }

    hydrateEvents(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const event = {
                id: row.event_id,
                paperId: row.event_paperId,
                actorId: row.event_actorId,
                paperVersionId: row.event_paperVersionId,
                status: row.event_status,
                type: row.event_type,
                visibility: row.event_visibility,
                eventDate: row.event_eventDate,

                assigneeId: row.event_assigneeId,
                reviewId: row.event_reviewId,
                reviewCommentId: row.event_reviewCommentId,
                submissionId: row.event_submissionId,
                newStatus: row.event_newStatus,
                paperCommentId: row.event_paperCommentId
            }

            if( ! dictionary[event.id] ) {
                dictionary[event.id] = event
                list.push(event.id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectEvents(where, params, order) {
        where = where ? where : ''
        params = params ? params : []
        order = order ? order : 'oldest'

        let orderSql = `paper_events.event_date asc`
        if ( order == 'newest' ) {
            orderSql = `paper_events.event_date desc`
        }

        const sql = `
            SELECT 
                paper_events.id as event_id, 
                paper_events.paper_id as "event_paperId",
                paper_events.actor_id as "event_actorId",
                paper_events.paper_version_id as "event_paperVersionId",
                paper_events.status as event_status,
                paper_events.type as event_type,
                paper_events.visibility::text[] as event_visibility, 
                paper_events.event_date as "event_eventDate",

                paper_events.assignee_id as "event_assigneeId", 
                paper_events.review_id as "event_reviewId",
                paper_events.review_comment_id as "event_reviewCommentId",
                paper_events.submission_id as "event_submissionId", 
                paper_events.new_status as "event_newStatus",
                paper_events.paper_comment_id as "event_paperCommentId"

            FROM paper_events
            ${where}
            ORDER BY ${orderSql}
        `
        
        const results = await this.database.query(sql, params)

        return this.hydrateEvents(results.rows)
    }

    /**
     *
     */
    async insertEvent(event) {
        let columns = ``
        let values = ``
        let params = []

        const validFields = [ 
            'paperId', 'actorId', 'paperVersionId', 'status', 'type', 
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
            } else if ( key == 'paperVersionId' ) {
                columns += `paper_version_id, `
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
        
        if ( results.rowCount <= 0 ) {
            throw DAOError(`Attempt to insert event failed.`)
        }
    }

    /**
     *
     */
    async updateEvent(event) {
        if ( ! event.visibility && ! event.status ) {
            throw new DAOError(`Only visibility or status may be updated.`)
        }

        if ( event.visibility ) {
            const results = await this.database.query(
                `UPDATE paper_events SET visibility = $1 WHERE id = $2`,
                [ event.visibility, event.id]
            )

            if ( results.rowCount <= 0 ) {
                throw new DAOError('update-failure', `Attempt to update event failed.`)
            }
        }

        if ( event.status ) {
            const results = await this.database.query(
                `UPDATE paper_events SET status = $1 WHERE id = $2`,
                [ event.status, event.id]
            )

            if ( results.rowCount <= 0 ) {
                throw new DAOError('update-failure', `Attempt to update event failed.`)
            }
        }

    }
}
