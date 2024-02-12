
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

    insertPermission(permission) {

    }

    updatePermission(data) {

    }

    deletePermission(id) {

    }
}

