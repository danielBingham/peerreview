module.exports = class FilesDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
    }

    hydrateFiles(rows) {
        const files = {}

        for(const row of rows) {
            const file = {
                id: row.id,
                filepath: row.filepath,
                type: row.type,
                createdDate: row.createdDate,
                updatedDate: row.updatedDate
            }

            if ( ! files[row.id] ) {
                files[row.id] = file
            }

        }

        return Object.values(files)
    }

    async selectFiles(where, params) {
        if ( ! where ) {
            where = ''
            params = []
        }
        const sql = `
            SELECT 
                files.id, files.filepath, files.type, files.created_date as "createdDate", files.updated_date as "updatedDate" 
                FROM files 
                ${where}
        `
        
        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return this.hydrateFiles(results.rows)
    }

    async insertFile(file) {
        const results = await this.database.query(`
            INSERT INTO files (id, filepath, type, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
        `, [ file.id, file.filepath, file.type ])

        if ( results.rowCount == 0) {
            throw new Error(`Failed to insert file ${file.id}.`)
        }
    }

    async updateFile(file) {
        const results = await this.database.query(`
            UPDATE files SET filepath=$1, type=$2, updated_date=now()
                WHERE id=$3
        `, [ file.filepath, file.type, file.id ])

        if ( results.rowCount == 0) {
            throw new Error(`Filed to update file ${file.id}.`)
        }
    }

    async updatePartialFile(file) {
        if ( ! file.id ) {
            throw new Error(`Can't update a file with out an Id.`)
        }

        let sql = 'UPDATE files SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'createdDate', 'updatedDate' ] 
        for(let key in file) {
            if (ignored.includes(key)) {
                continue
            }

            sql += `${key} = $${count}, `


            params.push(file[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(file.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0) {
            throw new Error(`Failed to update files ${file.id}.`)
        }


    }

}
