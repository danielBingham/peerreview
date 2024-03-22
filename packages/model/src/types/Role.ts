import { Model } from "./Model"

/**
 * Represents a role that grants permissions on either a paper or a journal.
 * Must be associated with either a paper or a journal.
 */
export interface Role extends Model {

    /** The name of this role.  **/
    name: string

    /** A short description of the role, used in place of the name to identify it.  **/
    shortDescription: string

    /** The type of role. ENUM of public, author, editor, or reviewer.  **/
    type: string

    /** A long description describing this role and its purpose.  **/
    description: string

    /** For journalId and paperId, these are each optional but one of them must be set. **/

    /** OPTIONAL. The id of the journal this role grants permissions on.  **/
    journalId: number

    /** OPTIONAL. The id of the paper this role grants permissions on.  **/
    paperId: number
}
