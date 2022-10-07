module.exports = class FeatureDAO {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.selectionString = `
            features.id as feature_id, features.name as feature_name, features.status as feature_status, 
            features.created_date as "feature_createdDate", features.updated_date as "feature_updatedDate"
        `
    }

    hydrateFeature(row) {
        return {
            id: row.feature_id,
            name: row.feature_name,
            status: row.feature_status,
            createdDate: row.feature_createdDate,
            updatedDate: row.feature_updatedDate
        }
    }

    hydrateFeatures(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const feature = this.hydrateFeature(row)

            if ( ! dictionary[feature.id] ) {
                dictionary[feature.id] = feature
                list.push(feature)
            }
        }
        return list
    }

    async selectFeatures(where, params) {
        where = where ? where : ''
        params = params ? params : []

        const sql = `
            SELECT
                ${this.selectionString}
            FROM features
            ${where}
        `

    }

    async insertFeature(feature) {
        const sql = `
            INSERT INTO features (name, created_date, updated_date)
                VALUES ($1, now(), now())
                RETURNING id
        `

        const result = await this.database.query(sql, [ feature.name, feature.githubIssue ])
        
        if ( result.rows.length <= 0 ) {
            throw new DAOError('insert-failed', `Failed to insert Feature(${feature.name}).`)
        }

        return result.rows[0].id
    }

    async updatePartialFeature(feature) {
        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE features SET '
        let params = []
        let count = 1
        for(let key in feature) {
            if (ignoredFields.includes(key)) {
                continue
            }

            sql += key + ' = $' + count + ', '

            params.push(feature[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count

        params.push(feature.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update Feature(${feature.id}) with partial update.`) 
        }
    }

}
