import { Model } from './Model'

export interface File extends Model {
    /** The User.id of the user who uploaded this file. */
    userId: number

    /** The location where this file is stored.  Probably an S3 bucket url. */
    location: string

    /** The file path to the file with in the location. */
    filepath: string

    /** The mimetype of this file.  */
    type: string

    /** Time/Date when the file was created. */
    createdDate: string

    /** Time/Date when the file was last updated. */
    updatedDate: string
}

export interface PartialFile extends Model {
    /** The User.id of the user who uploaded this file. */
    userId?: number

    /** The location where this file is stored.  Probably an S3 bucket url. */
    location?: string

    /** The file path to the file with in the location. */
    filepath?: string

    /** The mimetype of this file.  */
    type?: string
}
