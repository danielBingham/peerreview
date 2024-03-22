
module.exports = class PermissionDAO {

    constructor(core) {
        this.core = core
    }

    hydratePermissions(rows) {
        const dictionary = {}
        const list = []

        if ( ! rows || rows.length <= 0 ) {
            return {
                dictionary: dictionary,
                list: list
            }
        }

        for( const row of rows ) {
            if ( ! dictionary[row.Permission_id] ) {
                const permission = {} 
                permission.id = row.Permission_id
                permission.userId = row.Permision_userId
                permission.roleId = row.Permission_roleId
                permission.permission = row.Permission_permission

                permission.paperId = row.Permission_paperId
                permission.version = row.Permission_version
                permission.eventId = row.Permission_eventId
                permission.reviewId = row.Permission_reviewId
                permission.paperCommentId = row.Permission_paperCommentId
                permission.journalSubmissionId = row.Permission_journalSubmissionId
                permission.journalId = row.Permission_journalId

                dictionary[permission.id] = permission
                list.push(permission)
            }
        }

        return {
            dictionary: dictionary,
            list: list
        }
    }

    async selectPermissions(where, params) {
        where = where || ''
        params = params || []

        const sql = `
            SELECT
                permissions.id as "Permission_id",
                permissions.user_id as "Permission_userId", permissions.role_id as "Permission_roleId",
                permissions.permission as "Permission_permission",

                permissions.paper_id as "Permission_paperId", permissions.version as "Permission_version",
                permissions.event_id as "Permission_eventId", permissions.review_id as "Permission_reviewId",
                permissions.paper_comment_id as "Permission_paperCommentId", permissions.submission_id as "Permission_submissionId",
                permissions.journal_id as "Permission_journalId"

            FROM permissions
            ${where}
        `

        const results = await this.core.database.query(sql, params)

        return this.hydratePermissions(results.rows)
    }

    async insertPermission(permission) {
        const sql = `
            INSERT INTO permissions (user_id, role_id, permission, paper_id, version, event_id, review_id, paper_comment_id, submission_id, journal_id)
                VALUES ($1, $2, $3, $5, $5, $6, $7, $8, $9, $10)
                RETURNING id
        `
        const params = [ permission.userId, permission.roleId, permission.permission, permission.paperId, permission.version, permission.eventId, permission.reviewId, permission.paperCommentId, permission.submissionId, permission.journalId ]
        
        const results = await this.core.database.insert(sql, params)

        if ( results.rowCount <= 0 || results.rows.length <= 0 ) {
            throw new DAOError('Failed to insert permission.')
        }

        return results.rows[0].id
    }

    updatePermission(data) {

    }

    deletePermission(id) {

    }
}

