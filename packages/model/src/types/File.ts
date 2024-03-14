export interface File {
    /** The database id of this file in the `files` table. */
    id: number

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
