module.exports = class FeatureDAO {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.selectionString = `
            features.name as feature_name, features.status as feature_status, 
            features.created_date as "feature_createdDate", features.updated_date as "feature_updatedDate"
        `
    }

    hydrateFeature(row) {
        return {
            name: row.feature_name,
            status: row.feature_status,
            createdDate: row.feature_createdDate,
            updatedDate: row.feature_updatedDate
        }
    }

    hydrateFeatures(rows) {
        const dictionary = {}
        const list = []

        if ( rows.length <= 0 ) {
            return { list: list, dictionary: dictionary }
        }

        for(const row of rows) {
            const feature = this.hydrateFeature(row)

            if ( ! dictionary[feature.name] ) {
                dictionary[feature.name] = feature
                list.push(feature)
            }
        }
        return { list: list, dictionary: dictionary }
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

        const results = await this.database.query(sql, params)

        return this.hydrateFeatures(results.rows)
    }

    async insertFeature(feature) {
        const sql = `
            INSERT INTO features (name, created_date, updated_date)
                VALUES ($1, now(), now())
        `

        const result = await this.database.query(sql, [ feature.name ])
        
        if ( result.rowCount <= 0 ) {
            throw new DAOError('insert-failed', `Failed to insert Feature(${feature.name}).`)
        }
    }

    async updatePartialFeature(feature) {
        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'name', 'createdDate', 'updatedDate' ]

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
        sql += 'updated_date = now() WHERE name = $' + count

        params.push(feature.name)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update Feature(${feature.name}) with partial update.`) 
        }
    }

}
