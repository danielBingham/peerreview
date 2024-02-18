
/**
 * Represents a permission that can be assigned to either a `User` or to a
 * `Role`. The permission is a single permission of the form
 * `<Entity|Entities>:action`, granting the ability to execute `action` on
 * `<Entity|Entities>`.  Which entity or entities will be defined by setting
 * one of a number of id values relating the permission to the entity in
 * question.
 */
module.exports = class Permission {

    constructor(data) {
        /** The database id of this permission grant. @type {number} */
        this.id = null

        /** The user this permission is granted to or NULL if this is a role permission. @type {number} */
        this.userId = null

        /** The role this permission is granted to or NULL if this is a user permission. @type {number} */
        this.roleId = null

        /** 
         * The permission being granted.  A string of the form `<Entity|Entities>:action`.  @type {string} 
         *
         * @see database/initialization-scripts/schema.sql -> permission_type
         * for the full list of available permissions.
         **/
        this.permission = ''

        /** The id of the Paper this permission grants rights on, if any. @type {number} */
        this.paperId = null

        /** The version of the Paper this permission grants rights on, if any. @type {number} */
        this.version = null

        /** The id of the PaperEvent this permission grants rights on, if any. @type {number} */
        this.eventId = null

        /** The id of the Review this permission grants rights on, if any. @type {number} */
        this.reviewId = null

        /** The id of the PaperComment this permission grants rights on, if any. @type {number} */
        this.paperCommentId = null

        /** The id of the JournalSubmission this permission grants rights on, if any. @type {number} */
        this.submissionId = null

        /** The id of the Journal this permission grants rights on, if any. @type {number} */
        this.journalId = null

        if ( data ) {
            this.fromJSON(data)
        }
    }

    toJSON() {
        const data = {}
        data.userId = this.userId
        data.roleId = this.roleId
        data.permission = this.permission

        data.paperId = this.paperId
        data.version = this.version
        data.eventId = this.eventId
        data.reviewId = this.reviewId
        data.paperCommentId = this.paperCommentId
        data.submissionId = this.submissionId
        data.journalId = this.journalId
    }

    fromJSON(data) {
        this.userId = data.userId
        this.roleId = data.roleId
        this.permission = data.permission

        this.paperId = data.paperId
        this.version = data.version
        this.eventId = data.eventId
        this.reviewId = data.reviewId
        this.paperCommentId = data.paperCommentId
        this.submissionId = data.submissionId
        this.journalId = data.journalId
    }
}
