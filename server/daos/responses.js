const DAOError = require('../errors/DAOError')

module.exports = class ResponseDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
    }

    hydrateResponses(rows) {
        if ( rows.length <= 0) {
            return []
        }

        const responses = {}
        for( const row of rows) {
            const response = {
                id: row.response_id,
                paperId: row.response_paperId,
                userId: row.response_userId,
                createdDate: row.response_createdDate,
                updatedDate: row.response_updatedDate,
                versions: []
            }

            if ( ! responses[row.response_id] ) {
                responses[row.response_id] = response
            }

            const version = {
                version: row.version_version,
                content: row.version_content,
                createdDate: row.version_createdDate,
                updatedDate: row.version_updatedDate
            }

            if ( ! responses[row.response_id].versions.find((v) => v.version == version.version) ) {
                responses[row.response_id].versions.push(version)
            }
        }
        return Object.values(responses)
    }

    async selectResponses(where, params) {
        where = ( where ? where : '')
        params = ( params ? params : [])

        const sql = `
            SELECT
                responses.id as response_id, responses.paper_id as "response_paperId", responses.user_id as "response_userId",
                responses.created_date as "response_createdDate", responses.updated_date as "response_updatedDate",
                response_versions.version as version_version, response_versions.content as version_content,
                response_versions.created_date as "version_createdDate", response_versions.updated_date as "version_updatedDate"
            FROM responses 
                LEFT OUTER JOIN response_versions on responses.id = response_versions.response_id
            ${where}
        `
        const results = await this.database.query(sql, params)
        return this.hydrateResponses(results.rows)
    }

    async countResponses(where, params) {
        where = ( where ? where : '')
        params = ( params ? params : [])

        const sql = `
            SELECT
                count(responses.id) as response_count, responses.paper_id as "response_paperId"
            FROM responses
            ${where}
            GROUP BY responses.paper_id
       `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {} 
        } else if ( ! results.rows[0] ) {
            return {}
        }

        const count = {}
        for(const row of results.rows) {
            count[row.response_paperId] = row.response_count
        }
        return count
    }

    async insertResponse(response) {
        const results = await this.database.query(`
                    INSERT INTO responses (paper_id, user_id, created_date, updated_date) 
                        VALUES ($1, $2, now(), now()) 
                        RETURNING id
                `, 
            [ response.paperId, response.userId]
        )

        if ( results.rowCount <= 0 || results.rows.length <= 0) {
            throw new DAOError('insert-failure', `Attempt to insert response for paper ${response.paperId} and user ${response.userId} failed.`)
        }

        return results.rows[0].id
    }


    async insertResponseVersion(response, version) {
        const versionResults = await this.database.query(`
            SELECT MAX(version) as version FROM response_versions WHERE response_id = $1
        `, [ version.responseId ])

        let versionNumber = 1
        if (versionResults.rows.length > 0 && versionResults.rows[0].version) {
            versionNumber = versionResults.rows[0].version
        }

        const results = await this.database.query(`
                    INSERT INTO response_versions (response_id, version, content, created_date, updated_date) 
                        VALUES ($1, $2, $3, now(), now()) 
                `, 
            [ response.id, versionNumber, version.content]
        )

        if ( response.rowCount == 0) {
            throw new DAOError('insert-failure', 'Attempt to insert response version failed.')
        }
    }

    async updateResponse(response) {
        const results = await this.database.query(`
            UPDATE responses SET status = $1 AND updated_date=now() WHERE id = $2
        `, [ response.status, response.id ])

        if ( results.rowCount <= 0) {
            throw new DAOError('update-failure', `Attempt to update response ${response.id} failed.`)
        }
    }

    async updatePartialResponse(response) {
        let sql = 'UPDATE responses SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'paperId', 'userId', 'createdDate', 'updatedDate' ]
        for(let key in response) {
            if ( ignored.includes(key)) {
                continue
            }

            sql += `${key} = $${count} and `

            params.push(response[key])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`
        params.push(response.id)

        const results = await this.database.query(sql, params)
        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Attempt to update response ${response.id} with partial data failed.`)
        }
    }

    async deleteResponse(id) {
        const results = await this.database.query(
            'DELETE FROM responses WHERE id = $1',
            [ id ]
        )

        if ( results.rowCount == 0) {
            throw new DAOError('delete-failure', `Attempt to delete response ${id} failed.  It may never have existed.`)
        }
    }
}
