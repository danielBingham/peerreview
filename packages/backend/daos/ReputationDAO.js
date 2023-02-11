const FieldDAO = require('./FieldDAO')

const PAGE_SIZE = 20 

module.exports = class ReputationDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fieldDAO = new FieldDAO(database, logger)
    }

    hydrateReputation(rows) {
        const reputations = {}
        const list = []

        for(const row of rows) {
            const reputation = {
                reputation: row.field_reputation,
                field: this.fieldDAO.hydrateField(row)
            }

            if ( ! reputations[reputation.field.id] ) {
                reputations[reputation.field.id] = reputation
                list.push(reputation)
            }
        }

        return list
    }

    async countReputation(where, params, pageSize) {
        where = where ? where : ''
        params = params ? params : []
        pageSize = (pageSize && pageSize < PAGE_SIZE) ? pageSize : PAGE_SIZE

        const sql = `
            SELECT
                    COUNT(user_field_reputation.reputation) as count

                FROM user_field_reputation
                    JOIN fields ON fields.id = user_field_reputation.field_id
                ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                pageSize: pageSize,
                numberOfPages: 1
            }
        }

        return {
            count: results.rows[0].count,
            pageSize: pageSize,
            numberOfPages: parseInt(results.rows[0].count / PAGE_SIZE)+( results.rows[0].count % PAGE_SIZE > 0 ? 1 : 0)
        }
    }

    async selectReputation(where, params, page, pageSize) {
        where = where ? where : ''
        params = params ? params : []
        pageSize = (pageSize && pageSize < PAGE_SIZE) ? pageSize : PAGE_SIZE
        
        let limit = ''
        let offset = ''

        if ( page ) {
            const count = params.length

            limit = `LIMIT $${count+1}`
            offset = `OFFSET $${count+2}`

            params.push(pageSize)
            params.push((page-1) * pageSize)
        }

        const sql = `
            SELECT
                    user_field_reputation.reputation as field_reputation,

                    ${this.fieldDAO.selectionString}

                FROM user_field_reputation
                    JOIN fields ON fields.id = user_field_reputation.field_id
                ${where}
                ORDER BY user_field_reputation.reputation desc, fields.depth asc
                ${limit}
                ${offset}
        `

        const result = await this.database.query(sql, params)

        if ( result.rows.length <= 0) {
            return []
        }

        return this.hydrateReputation(result.rows)
    }

}
