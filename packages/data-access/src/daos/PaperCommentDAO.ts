/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Pool, Client, QueryResultRow } from 'pg'

import { Core, DAOError } from '@journalhub/core'

import { PaperComment, PartialPaperComment, ModelDictionary } from '@journalhub/model'

import { DAOQuery, DAOResult } from '../types/DAO'


export class PaperCommentDAO {
    core: Core
    database: Pool | Client

    constructor(core: Core, database?: Pool | Client) {
        this.core = core

        this.database = database ? database : this.core.database
    }

    getPaperCommentSelectionString(): string {
        return `
        paper_comments.id as PaperComment_id,
        paper_comments.paper_id as "PaperComment_paperId",
        paper_comments.paper_version as "PaperComment_paperVersion",
        paper_comments.user_id as "PaperComment_userId",
        paper_comments.status as PaperComment_status,
        paper_comments.content as PaperComment_content,
        paper_comments.created_date as "PaperComment_createdDate",
        paper_comments.updated_date as "PaperComment_updatedDate",
        paper_comments.committed_date as "PaperComment_committedDate"
        `
    }

    hydratePaperComment(row: QueryResultRow): PaperComment  {
        return {
            id: row.PaperComment_id,
            paperId: row.PaperComment_paperId,
            paperVersion: row.PaperComment_paperVersion,
            userId: row.PaperComment_userId,
            status: row.PaperComment_status,
            content: row.PaperComment_content,
            createdDate: row.PaperComment_createdDate,
            updatedDate: row.PaperComment_updatedDate,
            committedDate: row.PaperComment_committedDate
        }
    }

    hydratePaperComments(rows: QueryResultRow[]): DAOResult<PaperComment> {
        const dictionary: ModelDictionary<PaperComment> = {}
        const list: number[] = []

        if ( rows.length <= 0 ) {
            return {
                dictionary: dictionary,
                list: list
            }
        }

        for(const row of rows) {
            const comment = this.hydratePaperComment(row)
            
            if ( ! dictionary[comment.id] ) {
                dictionary[comment.id] = comment
                list.push(comment.id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Select PaperComment models from the database using a DAOQuery.
     */
    async selectPaperComments(query: DAOQuery): Promise<DAOResult<PaperComment>> {
        const where = query.where || ''
        const params = query.params || []

        if ( query?.order !== undefined ) {
            throw new DAOError('not-supported', 'Order not supported.')
        }

        let order = 'paper_comments.committed_date asc, paper_comments.created_date asc'

        const page = query.page || 0 
        const itemsPerPage = query.itemsPerPage || 20

        let paging = ''
        if ( page > 0 ) {
            paging = `
                LIMIT ${itemsPerPage}
                OFFSET ${(page-1) * itemsPerPage} 
            `
        }

        const sql = `
            SELECT 
                ${this.getPaperCommentSelectionString()}
            FROM paper_comments
            ${where}
            ORDER BY ${order} 
            ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydratePaperComments(results.rows)
    }

    /**
     * Insert a PaperComment model into the `paper_comments` table.
     */
    async insertPaperComment(paperComment: PaperComment): Promise<number> {
        const results = await this.database.query(`
            INSERT INTO paper_comments (paper_id, paper_version, user_id, status, content, created_date, updated_date )
                VALUES ( $1, $2, $3, $4, $5, now(), now())
                RETURNING id
        `, [ paperComment.paperId, paperComment.paperVersion, paperComment.userId, paperComment.status, paperComment.content ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('insert-failure', 
                `Failed to insert PaperComment() for Paper(${paperComment.paperId}) and User(${paperComment.userId}).`)
        }

        return results.rows[0].id
    }

    /**
     * Update the row in the `paper_comments` table corresponding to the
     * provided PartialPaperComment model.  PartialPaperComment must have `id`
     * set.
     */
    async updatePaperComment(paperComment: PartialPaperComment): Promise<void> {
        if ( ! paperComment.id ) {
            throw new DAOError('missing-id', `Attempt to update a PaperComment with out providing the id of the comment to be updated.`)
        }
    
        const validFields = [ 'status', 'content', 'committedDate' ]

        let sql = 'UPDATE paper_comments SET '

        let params = []
        let count = 1
        for(const [ key, value] of Object.entries(paperComment)) {
            if ( ! validFields.includes(key)) {
                continue
            }
            if ( key == 'committedDate' ) {
                sql += `committed_date = now(), `
            } else {
                sql += `${key} = $${count}, `
                params.push(value)
                count = count + 1
            }
        }
        sql += `updated_date = now() WHERE id = $${count}`
        params.push(paperComment.id)

        const results = await this.database.query(sql, params)
        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failed', 
                `Failed to update PaperComment(${paperComment.id}).`)
        }
    }

    async deletePaperComment(id: number): Promise<void> {
        const results = await this.database.query(`
            DELETE FROM paper_comments WHERE id = $1
        `, [ id ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('delete-failed',
                `Failed to delete PaperComment(${id}).`)
        }
    }

    /**
     * Create a new version of a comment.    We return the inserted version.
     */
    async insertPaperCommentVersion(paperComment: PaperComment): Promise<number> {
        // Determine the next version.
        let version = 1

        const versionResults = await this.database.query(`
            SELECT version FROM paper_comment_versions WHERE paper_comment_id = $1 ORDER BY version desc
        `, [ paperComment.id ])

        if ( versionResults.rows.length > 0 ) {
            version = versionResults.rows[0].version+1
        }

        // Insert that version.
        const sql = `
            INSERT INTO paper_comment_versions (paper_comment_id, version, content, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now()) 
        `
        const results = await this.database.query(sql, [ paperComment.id, version, paperComment.content ])

        if ( ! results.rowCount || results.rowCount == 0 ) {
            throw new DAOError('version-insert-failed', `Failed to insert PaperCommentVersion for PaperComment(${paperComment.id}).`)
        }

        return version 
    }

    async revertVersion(paperCommentId: number): Promise<void> {
        const results = await this.database.query(`
            SELECT content FROM paper_comment_versions WHERE paper_comment_id = $1 ORDER BY version DESC
        `, [ paperCommentId ])

        if ( results.rows.length <= 0 ) {
            throw new DAOError('failed-revert',
                `Attempt to revert PaperComment(${paperCommentId}) but no previous version exists!`)
        }

        await this.updatePaperComment({ id: paperCommentId, status: 'committed', content: results.rows[0].content })
    }
}
