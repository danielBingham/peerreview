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
                version: row.event_version,
                type: row.event_type,
                visibility: row.event_visibility,
                eventDate: row.event_eventDate,

                assigneeId: row.event_assigneeId,
                reviewId: row.event_reviewId,
                reviewCommentId: row.event_reviewCommentId,
                submissionId: row.event_submissionId,
                newStatus: row.event_newStatus
            }

            if( ! dictionary[event.id] ) {
                dictionary[event.id] = event
                list.push(event.id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectEvents(where, params) {
        const sql = `
SELECT 
    paper_events.id as event_id, 
    paper_events.paper_id as "event_paperId",
    paper_events.actor_id as "event_actorId",
    paper_events.version as event_version,
    paper_events.type as event_type,
    paper_events.visibility as event_visibility, 
    paper_events.event_date as "event_eventDate",

    paper_events.assignee_id as "event_assigneeId", 
    paper_events.review_id as "event_reviewId",
    paper_events.review_comment_id as "event_reviewCommentId",
    paper_events.submission_id as "event_submissionId", 
    paper_events.new_status as "event_newStatus"

FROM paper_events
${where}
ORDER BY paper_events.event_date asc 
        `

        const results = await this.database.query(sql, params)

        return this.hydrateEvents(results.rows)
    }

    /**
     *
     */
    async insertEvent(event) {
        // If we don't have a version already, grab it from the database.
        if ( ! event.version ) {
            const versionResults = await this.database.query(
                `SELECT version FROM paper_versions WHERE paper_id = $1 ORDER BY version desc`, 
                [ event.paperId ]
            )
            event.version = versionResults.rows[0].version
        }

        let columns = ``
        let values = ``
        let params = []

        let count = 1
        for(const [key, value] of Object.entries(event)) {
            
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

        console.log(sql)

        const results = await this.database.query(sql, params)
        
        if ( results.rowCount <= 0 ) {
            throw DAOError(`Attempt to insert event failed.`)
        }
    }

    /**
     *
     */
    async updateEvent(event) {
        if ( ! event.visibility ) {
            throw new DAOError(`Only visibility may be updated.`)
        }

        const results = await this.database.query(`UPDATE paper_events SET visibility = $1 WHERE id = $2`, [ event.visibility, event.id])

        if ( results.rowCount <= 0 ) {
            throw DAOError(`Attempt to update event failed.`)
        }
    }
}
