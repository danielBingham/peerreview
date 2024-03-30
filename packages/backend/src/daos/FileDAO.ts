import { Pool, QueryResultRow } from 'pg'

import DAOError from '../errors/DAOError'

import Core from '../core'
import { File, PartialFile, DatabaseResult, ModelDictionary } from '@danielbingham/peerreview-model'

/**
 * The data access object for the `files` table.
 *
 * Maps `File` objects to and from the database.
 */
export default class FilesDAO {
    core: Core

    /**
     * Initialize the DAO with the Core.
     */
    constructor(core: Core) {
        this.core = core
    }

    /**
     * The selection string for the `files` table, used with `hydrateFile()` to
     * map the `files` table to `File` models.
     *
     * @return {string} The selection string.
     */
    getFilesSelectionString(): string {
        return `files.id as "File_id", files.user_id as "File_userId", files.location as "File_location", files.filepath as "File_filepath", files.type as "File_type",
            files.created_date as "File_createdDate", files.updated_date as "File_updatedDate"` 
    }

    /**
     * Hydrate a single File model from an instance of pg's `QueryResultRow`.
     * The query must contain the selection string returned by
     * `getFileSelectionString()`, though it can contain additional data that
     * will be ignored.
     *
     * @param {QueryResultRow} row  The result row from a call of
     * `Pool.query()` used to populate the model.
     *
     * @return {File}   The hydrated File model.
     */
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

    /**
     * Hydrate a `DatabaseResult` of File models from an array of pg's
     * `QueryResultRow`, returned from a query to `Pool.query()`.  The query
     * must be formed using `getFileSelectionString()`.
     *
     * @param {QueryResultRow[]} rows   An array of QueryResultRow returned
     * from a call to `Pool.query()`.  
     *
     * @return {DatabaseResult<File>} A populated Database result with a `list`
     * preserving query order and a `Dictionary` allowing easy access to Models
     * by ID.
     */
    hydrateFiles(rows: QueryResultRow[]): DatabaseResult<File> {
        const dictionary: ModelDictionary<File> = {}
        const list: number[] = []

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
                list.push(row.File_id)
            }

        }

        return {
            dictionary: dictionary,
            list: list
        }
    }

    /**
     * Select File models from the `files` table using an optional
     * parameterized SQL `WHERE` statement.
     *
     * @param {string} where    (Optional) An SQL `WHERE` statement,
     * parameterized for use with pg's `Pool.query()` function.
     * @param {any[]} params    (Optional) Parameters for use with `where`.
     * Must match the parameters in the `where` statement.
     *
     * @return {Promise<DatabaseResult<File>>} A Promise that resolves to a
     * populated DatabaseResult<File> containing the hydrated File models that
     * result from the query.
     */
    async selectFiles(where?: string, params?: any[]): Promise<DatabaseResult<File>> {
        where = where ? where : ''
        params = params ? params : []

        const sql = `
            SELECT 
                ${ this.getFilesSelectionString() } 
                FROM files 
                ${where}
        `
        
        const results = await this.core.database.query(sql, params)

        return this.hydrateFiles(results.rows)
    }

    /**
     * Insert a `File` model into the database.
     *
     * @param {File} file   The populated file model we want to use to insert a
     * row into the `files` table.
     *
     * @return {Promise<void>}
     */
    async insertFile(file: File): Promise<void> {
        const results = await this.core.database.query(`
            INSERT INTO files (id, user_id, location, filepath, type, created_date, updated_date)
                VALUES ($1, $2, $3, $4, $5, now(), now())
        `, [ file.id, file.userId, file.location, file.filepath, file.type ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-insert', `Failed to insert file ${file.id}.`)
        }
    }

    /**
     *  Update the row in the `files` table corresponding to a complete `File`
     *  model.
     *
     *  @param {File} file  The model we'd like to use to update the
     *  corresponding row in the `files` table.
     *
     *  @return {Promise<void>}
     */
    async updateFile(file: File): Promise<void> {
        const results = await this.core.database.query(`
            UPDATE files SET user_id = $1, location=$2, filepath=$3, type=$4, updated_date=now()
                WHERE id=$5
        `, [ file.userId, file.location, file.filepath, file.type, file.id ])

        if ( results.rowCount == 0) {
            throw new DAOError('failed-update', `Filed to update file ${file.id}.`)
        }
    }

    /**
     * Update a row in the `files` table using a `PartialFile` model, allowing
     * partial rows to be updated.
     *
     * @params {PartialFile} file   The PartialFile object to use for updating
     * the associated database row.
     *
     * @return {Promise<void>}
     */
    async updatePartialFile(file: PartialFile): Promise<void>  {
        let sql = 'UPDATE files SET '
        let params: any = []
        let count = 1
        for(let key of Object.keys(file)) {
            if ( key == 'id' ) {
                continue
            }

            if ( key == 'userId' ) {
                sql += `user_id = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }

            params.push(file[key as keyof PartialFile])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(file.id)

        const results = await this.core.database.query(sql, params)

        if ( ! results.rowCount || results.rowCount <= 0) {
            throw new DAOError('failed-update', `Failed to update files ${file.id}.`)
        }
    }

    /**
     * Delete a row in the `files` table identified by `fileId`.
     *
     * NOTE: Does *not* delete the associated file from the file store.
     *
     * @return {Promise<void>}
     */
    async deleteFile(fileId: number): Promise<void> {
        const pathResults = await this.core.database.query(`
            SELECT filepath FROM files WHERE id = $1
        `, [ fileId ])

        if ( pathResults.rows.length <= 0) {
            throw new DAOError('not-found', `File ${fileId} doesn't seem to exist!`)
        }

        // TECHDEBT TODO We need to delete the file here.

        const results = await this.core.database.query(`
            DELETE FROM files WHERE id = $1
        `, [ fileId])

        if ( results.rowCount !== 1 ) {
            throw new DAOError('failed-delete', `Failed to delete file ${fileId}`)
        }
    }

}
