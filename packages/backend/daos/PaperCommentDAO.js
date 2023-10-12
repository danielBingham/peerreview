module.exports = class PaperCommentDAO {

    constructor(core, database) {
        this.core = core

        this.database = database ? database : this.core.database
    }

    hydratePaperComment(row) {
        return {
            id: row.comment_id,
            paperId: row.comment_paperId,
            userId: row.comment_userId,
            status: row.comment_status,
            content: row.comment_content,
            createdDate: row.comment_createdDate,
            updatedDate: row.comment_updatedDate,
            committedDate: row.comment_committedDate
        }
    }

    hydratePaperComments(rows) {
        const results = {
            dictionary: {},
            list: []
        }

        if ( rows.length <= 0 ) {
            return results
        }

        for(const row of rows) {
            const comment = this.hydratePaperComment(row)
            
            if ( ! results.dictionary[comment.id] ) {
                results.dictionary[comment.id] = comment
                results.list.push(comment.id)
            }
        }

        return results
    }

    async selectPaperComments(where, params) {
        const sql = `
            SELECT 
                paper_comments.id as comment_id,
                paper_comments.paper_id as "comment_paperId",
                paper_comments.user_id as "comment_userId",
                paper_comments.status as comment_status,
                paper_comments.content as comment_content,
                paper_comments.created_date as "comment_createdDate",
                paper_comments.updated_date as "comment_updatedDate",
                paper_comments.committed_date as "comment_committedDate"
            FROM paper_comments
            ${where}
            ORDER BY paper_comments.committed_date, paper_comments.created_date
        `

        const results = await this.database.query(sql, params)
        return this.hydratePaperComments(results.rows)
    }

    async insertPaperComment(paperComment) {
        const results = await this.database.query(`
            INSERT INTO paper_comments (paper_id, user_id, status, content, created_date, updated_date )
                VALUES ( $1, $2, 'in-progress', $3, now(), now())
        `, [ paperComment.paperId, paperComment.userId, paperComment.content ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('insert-failure', 
                `Failed to insert PaperComment() for Paper(${paperComment.paperId}) and User(${paperComment.userId}).`)
        }
    }

    /**
     * Insert new Paper Comment Version
     *
     * Create a new version of a comment.    We return the inserted version.
     *
     * @param {Object} comment  The comment we want to insert a version for.
     * @param {int} existingVersion The current version.
     *
     * @return {int} The version number of the inserted version.
     */
    async insertPaperCommentVersion(paperComment, existingVersion) {
        this.logger.debug(`Creating a version for PaperComment(${paperComment.id}) with verison ${existingVersion}`)
        this.logger.debug(paperComment)

        const sql = `
            INSERT INTO paper_comment_versions (paper_comment_id, version, content, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now()) 
        `
        const version = existingVersion ? existingVersion+1 : 1
        const results = await this.database.query(sql, [ paperComment.id, version, paperComment.content ])

        if ( results.rowCount == 0 ) {
            throw new DAOError('version-insert-failed', `Failed to insert PaperCommentVersion for PaperComment(${id}).`)
        }

        return version
    }

    async updatePaperComment(paperComment) {
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
            }

            params.push(value)
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`
        params.push(paperComment.id)

        const results = await this.database.query(sql, params)
        if ( results.rowCount == 0 ) {
            throw new DAOError('update-failed', 
                `Failed to update PaperComment(${papercomment.id}).`)
        }
    }

    async deletePaperComment(id) {
        const results = await this.database.query(`
            DELETE FROM paper_comments WHERE id = $1
        `, [ id ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('delete-failed',
                `Failed to delete PaperComment(${id}).`)
        }
    }
}
