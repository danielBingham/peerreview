const { File } = require('./File')

/**
 * A version of a scholarly paper.
 */
class PaperVersion {
    
    constructor(data) {

        /** The file associated with this version. @type {File} */
        this.file = null

        /** 
         * The version number of this version. Increments by 1 with each
         * version, starting from 1.
         * @type {number}
         */
        this.version = 0

        /** The content of the paper.  @type {string} */
        this.content = ''

        /** The number of reviews on this version of the paper. @type {number} */
        this.reviewCount = 0

        /** The time and date this version was created. @type {string(timestamp)} */
        this.createdDate = null

        /** The time and date this version was last updated. @type {string(timestamp)} */
        this.updatedDate = null

        if ( data ) {
            this.fromJSON(data)
        }
    }

    toJSON() {
        const data = {
            file: this.file.toJSON(),
            version: this.version,
            content: this.content,
            reviewCount: this.reviewCount,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate
        }
        return data
    }

    fromJSON(data) {
        this.file = new File(data.file)

        this.version = data.version
        this.content = data.content
        this.reviewCount = data.reviewCount
        this.createdDate = data.createdDate
        this.updatedDate = data.updatedDate
    }

}

/**
 * An author of a paper.
 */
class PaperAuthor {

    constructor(data) {

        /** The User.id of the user associated with this author. @type {number} */
        this.userId = null

        /** The order this author should be displayed on the paper. @type {number} */
        this.order = 0

        /** Is this author an owner of this paper? @type {boolean} */
        this.owner = false

        /** Is this author the one who submitted the paper? @type {boolean} */
        this.submitter = false

        /** The role being assigned to this author.  Not stored in the database.  @type {string} */
        this.role = 'author'
        
        if ( data ) {
            this.fromJSON(data)
        }
    }
    
    toJSON() {
        const data = {
            userId: this.userId,
            order: this.order,
            owner: this.owner,
            submitter: this.submitter,
            role: this.role 
        }
        return data
    }

    fromJSON(data) {
        this.userId = data.userId
        this.order = data.order
        this.owner = data.owner
        this.submitter = data.submitter
        this.role = data.role
    }
}

/**
 * A scholarly paper or scholarly work.
 */
class Paper {

    constructor(data) {

        /**  The id of this paper in the `papers` table. @type {number} */
        this.id = null

        /** This paper's title. @type {string} */
        this.title = ''

        /** 
         * Is this paper a draft or is it published?
         * Once it is published, it can no longer be edited.
         * @type {boolean}
         */
        this.isDraft = true 

        /** Does this paper have a public preprint? @type {boolean} */
        this.showPreprint = false

        // Unused techdebt.
        // This was the paper's score in Peer Review's reputation system.
        this.score = 0

        /** The time this paper was created. @type {string<timestamp>} */
        this.createdDate = null

        /** The last time this paper was edited. @type {string<timestamp>} */
        this.updatedDate = null

        /** 
         * A list of PaperAuthor objects representing this paper's authors.
         * @type {PaperAuthor[]} 
         */
        this.authors = []

        /**
         * An array of Field.id representing the fields this paper is tagged with.
         * @type {number[]}
         */
        this.fields = []

        /**
         * An array of PaperVersion objects representing the different versions
         * of this paper.
         * @type {PaperVersion[]}
         */
        this.versions = []

        if ( data ) {
            this.fromJSON(data)
        }
    }
    
    toJSON() {
        const data = {
            id: this.id,
            title: this.title,
            isDraft: this.isDraft,
            showPreprint: this.showPreprint,
            score: this.score,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate,
            authors: this.authors.reduce((array, author) => {
                array.push(author.toJSON())
                return array
            }, []),
            fields: this.fields,
            versions: this.versions.reduce((array, version) => {
                array.push(version.toJSON())
                return array
            }, [])
        }
        return data
    }

    fromJSON(data) {
        this.id = data.id
        this.title = data.title
        this.isDraft = data.isDraft
        this.showPreprint = data.showPreprint
        this.score = data.score
        this.createdDate = data.createdDate
        this.updatedDate = data.updatedDate
        this.authors = data.authors.reduce((array, author) => {
            array.push(new PaperAuthor(author))
            return array
        }, []),
        this.versions = data.versions.reduce((array, version) => {
            array.push(new PaperVersion(version))
            return array
        }, []),
        this.fields = data.fields
    }
}

module.exports = {
    PaperVersion: PaperVersion,
    PaperAuthor: PaperAuthor,
    Paper: Paper
}
