const FileService = require('../services/files')
const DAOError = require('../errors/DAOError')


module.exports = class FilesDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fileService = new FileService(database, logger)
    }

    hydrateFiles(rows) {
        const files = {}

        for(const row of rows) {
            const file = {
                id: row.id,
                userId: row.userId,
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
                files.id, files.user_id as "userId", files.filepath, files.type, files.created_date as "createdDate", files.updated_date as "updatedDate" 
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
            INSERT INTO files (id, user_id, filepath, type, created_date, updated_date)
                VALUES ($1, $2, $3, $4, now(), now())
        `, [ file.id, file.userId, file.filepath, file.type ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-insert', `Failed to insert file ${file.id}.`)
        }
    }

    async updateFile(file) {
        const results = await this.database.query(`
            UPDATE files SET user_id = $1, filepath=$2, type=$3, updated_date=now()
                WHERE id=$4
        `, [ file.userId, file.filepath, file.type, file.id ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-update', `Filed to update file ${file.id}.`)
        }
    }

    async updatePartialFile(file) {
        if ( ! file.id ) {
            throw new DAOError('missing-id', `Can't update a file with out an Id.`)
        }

        let sql = 'UPDATE files SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'createdDate', 'updatedDate' ] 
        for(let key in file) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'userId' ) {
                sql += `user_id = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }


            params.push(file[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(file.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0) {
            throw new DAOError('failed-update', `Failed to update files ${file.id}.`)
        }
    }

    async deleteFile(fileId) {
        const pathResults = await this.database.query(`
            SELECT filepath FROM files WHERE id = $1
        `, [ fileId ])

        if ( pathResults.rows.length <= 0) {
            throw new DAOError('not-found', `File ${fileId} doesn't seem to exist!`)
        }

        const filepath = pathResults.rows[0].filepath

        const results = await this.database.query(`
            DELETE FROM files WHERE id = $1
        `, [ fileId])

        if ( results.rowCount !== 1 ) {
            throw new DAOError('failed-delete', `Failed to delete file ${fileId}`)
        }

        this.fileService.removeFile(filepath)
    }

}