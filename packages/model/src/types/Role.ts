/**
 * Represents a role that grants permissions on either a paper or a journal.
 * Must be associated with either a paper or a journal.
 */
export interface Role {
    /** The database id of this role. @type {number} **/
    id: number

    /** The name of this role. @type {string} **/
    name: string

    /** A short description of the role, used in place of the name to identify it. @type {string} **/
    shortDescription: string

    /** The type of role. ENUM of public, author, editor, or reviewer. @type {string} **/
    type: string

    /** A long description describing this role and its purpose. @type {string} **/
    description: string

    /** For journalId and paperId, these are each optional but one of them must be set. **/

    /** OPTIONAL. The id of the journal this role grants permissions on. @type {number} **/
    journalId: number

    /** OPTIONAL. The id of the paper this role grants permissions on. @type {number} **/
    paperId: number
}
