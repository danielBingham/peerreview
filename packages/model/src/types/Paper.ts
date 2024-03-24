import { File } from "./File"
import { Model } from "./Model"

/**
 * A version of a scholarly paper.
 */
export interface PaperVersion {
    /** The file associated with this version. */
    file: File 

    /** 
     * The version number of this version. Increments by 1 with each
     * version, starting from 1.
     */
    version: number

    /** The content of the paper. */
    content: string

    /** The number of reviews on this version of the paper. */
    reviewCount: number

    /** The time and date this version was created. */
    createdDate: string

    /** The time and date this version was last updated. */
    updatedDate: string
}

/**
 * An author of a scholarly work.
 */
export interface PaperAuthor {
    /** The User.id of the user associated with this author. */
    userId: number

    /** The order this author should be displayed on the paper. */
    order: number

    /** Is this author an owner of this paper? */
    owner: boolean 

    /** Is this author the one who submitted the paper? */
    submitter: boolean  

    /** The role being assigned to this author.  Not stored in the database. */
    role: string 
}

export interface Paper extends Model {

    /** The database id of this paper. **/
    id: number

    /** This paper's title. */
    title: string

    /** 
     * Is this paper a draft or is it published?
     * Once it is published, it can no longer be edited.
     */
    isDraft: boolean

    /** Does this paper have a public preprint? */
    showPreprint: boolean

    // Unused techdebt.
    // This was the paper's score in Peer Review's reputation system.
    score: number

    /** The time this paper was created. */
    createdDate: string

    /** The last time this paper was edited. */
    updatedDate: string

    /** 
     * A list of PaperAuthor objects representing this paper's authors.
     */
    authors: PaperAuthor[]

    /**
     * An array of Field.id representing the fields this paper is tagged with.
     */
    fields: number[]

    /**
     * An array of PaperVersion objects representing the different versions
     * of this paper.
     */
    versions: PaperVersion[]

}
