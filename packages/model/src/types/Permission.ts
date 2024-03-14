
/**
 * Represents a permission that can be assigned to either a `User` or to a
 * `Role`. The permission is a single permission of the form
 * `<Entity|Entities>:action`, granting the ability to execute `action` on
 * `<Entity|Entities>`.  Which entity or entities will be defined by setting
 * one of a number of id values relating the permission to the entity in
 * question.
 */
export interface Permission {
        /** The database id of this permission grant.  */
        id: number

        /** The user this permission is granted to or NULL if this is a role permission.  */
        userId: number

        /** The role this permission is granted to or NULL if this is a user permission.  */
        roleId: number

        /** 
         * The permission being granted.  A string of the form `<Entity|Entities>:action`.   
         *
         * @see database/initialization-scripts/schema.sql -> permission_type
         * for the full list of available permissions.
         **/
        permission: string

        /** The id of the Paper this permission grants rights on, if any.  */
        paperId: number

        /** The version of the Paper this permission grants rights on, if any.  */
        version: number

        /** The id of the PaperEvent this permission grants rights on, if any.  */
        eventId: number

        /** The id of the Review this permission grants rights on, if any.  */
        reviewId: number

        /** The id of the PaperComment this permission grants rights on, if any.  */
        paperCommentId: number

        /** The id of the JournalSubmission this permission grants rights on, if any.  */
        submissionId: number

        /** The id of the Journal this permission grants rights on, if any.  */
        journalId: number

}
