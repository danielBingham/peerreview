
class File {

    constructor(data) {

        /** The database id of this file in the `files` table. @type {number} */
        this.id = null

        /** The User.id of the user who uploaded this file. @type {number} */
        this.userId = null

        /** The location where this file is stored.  Probably an S3 bucket url. @type {string} */
        this.location = ''

        /** The file path to the file with in the location. @type {string} */
        this.filepath = ''

        /** The mimetype of this file.  @type {string} */
        this.type = ''

        /** Time/Date when the file was created. @type {string<timestamp>} */
        this.createdDate = null

        /** Time/Date when the file was last updated. @type {string<timestamp>} */
        this.updatedDate = null

        if ( data ) {
            this.fromJSON(data)
        }
    }

    toJSON() {
        const data = {
            id: this.id,
            userId: this.userId,
            location: this.location,
            filepath: this.filepath,
            type: this.type,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate
        }
        return data
    }

    fromJSON(data) {
        this.id = data.id
        this.userId = data.userId
        this.location = data.location
        this.filepath = data.filepath
        this.type = data.type
        this.createdDate = data.createdDate
        this.updatedDate = data.updatedDate
    }
}

module.exports = {
    File: File
}
