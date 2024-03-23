import { Pool, QueryResultRow } from 'pg'

import DAOError from '../errors/DAOError'

import Core from '../core'
import Logger from '../logger'

import { File, DatabaseResult, ModelDictionary } from '@danielbingham/peerreview-model'

/**
 * The data access object for the `files` table.
 *
 * Maps `File` objects to and from the database.
 */
export default class FilesDAO {
    database: Pool
    logger: Logger

    constructor(core: Core) {
        this.database = core.database
        this.logger = core.logger
    }

    hydrateFile(row: QueryResultRow): File {
        return {
            id: row.File_id,
            userId: row.File_userId,
            location: row.File_location,
            filepath: row.File_filepath,
            type: row.File_type,
            createdDate: row.File_createdDate,
            updatedDate: row.File_updatedDate
        }
    }

    hydrateFiles(rows: QueryResultRow[]): DatabaseResult<File> {
        const dictionary: ModelDictionary<File> = {}
        const list: File[] = []

        if ( rows.length <= 0 ) {
            return {
                dictionary: dictionary,
                list: list
            }
        }

        for(const row of rows) {
            const file = this.hydrateFile(row)
            if ( ! dictionary[row.File_id] ) {
                dictionary[row.File_id] = file
                list.push(file)
            }

        }

        return {
            dictionary: dictionary,
            list: list
        }
    }

    getFilesSelectionString(): string {
        return `files.id as "File_id", files.user_id as "File_userId", files.location as "File_location", files.filepath as "File_filepath", files.type as "File_type",
            files.created_date as "File_createdDate", files.updated_date as "File_updatedDate"` 
    }

    async selectFiles(where?: string, params?: any[]): Promise<DatabaseResult<File>> {
        where = where ? where : ''
        params = params ? params : []

        const sql = `
            SELECT 
                ${ this.getFilesSelectionString() } 
                FROM files 
                ${where}
        `
        
        const results = await this.database.query(sql, params)

        return this.hydrateFiles(results.rows)
    }

    async insertFile(file: File): Promise<void> {
        const results = await this.database.query(`
            INSERT INTO files (id, user_id, location, filepath, type, created_date, updated_date)
                VALUES ($1, $2, $3, $4, $5, now(), now())
        `, [ file.id, file.userId, file.location, file.filepath, file.type ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-insert', `Failed to insert file ${file.id}.`)
        }
    }

    async updateFile(file: File): Promise<void> {
        const results = await this.database.query(`
            UPDATE files SET user_id = $1, location=$2, filepath=$3, type=$4, updated_date=now()
                WHERE id=$5
        `, [ file.userId, file.location, file.filepath, file.type, file.id ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-update', `Filed to update file ${file.id}.`)
        }
    }

    async updatePartialFile(file: File): Promise<void>  {
        if ( ! file.id ) {
            throw new DAOError('missing-id', `Can't update a file with out an Id.`)
        }

        let sql = 'UPDATE files SET '
        let params: any = []
        let count = 1
        const ignored = [ 'id', 'createdDate', 'updatedDate' ] 
        for(let key of Object.keys(file)) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'userId' ) {
                sql += `user_id = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }

            params.push(file[key as keyof File])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(file.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount && results.rowCount <= 0) {
            throw new DAOError('failed-update', `Failed to update files ${file.id}.`)
        }
    }

    async deleteFile(fileId: number): Promise<void> {
        const pathResults = await this.database.query(`
            SELECT filepath FROM files WHERE id = $1
        `, [ fileId ])

        if ( pathResults.rows.length <= 0) {
            throw new DAOError('not-found', `File ${fileId} doesn't seem to exist!`)
        }

        // TECHDEBT TODO We need to delete the file here.

        const results = await this.database.query(`
            DELETE FROM files WHERE id = $1
        `, [ fileId])

        if ( results.rowCount !== 1 ) {
            throw new DAOError('failed-delete', `Failed to delete file ${fileId}`)
        }
    }

}
