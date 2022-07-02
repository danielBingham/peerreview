const UserDAO = require('./user')

module.exports = class PaperDAO {

    constructor(database) {
        this.database = database
        this.userDAO = new UserDAO(database)
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydratePapers(rows) {
        if ( rows.length == 0 ) {
            return null 
        }

        const papers = {}

        rows.forEach(function(row) {
            const paper = {
                id: row.paper_id,
                title: row.paper_title,
                isDraft: row.paper_isDraft,
                createdDate: row.paper_createdDate,
                updatedDate: row.paper_updatedDate,
                authors: [],
                fields: [],
                versions: [],
                votes: []
            }

            if ( ! papers[paper.id] ) {
                papers[paper.id] = paper
            }

            const author = {
                id: row.author_id,
                order: row.author_order,
                owner: row.author_owner
            }

            if ( ! papers[paper.id].authors.find((a) => a.id == author.id)) {
                papers[paper.id].authors.push(author)
            }

            const paper_version = {
                filepath: row.paper_filepath,
                version: row.paper_version
            }
            // Ignore versions that haven't finished uploading.
            if (paper_version.version && ! papers[paper.id].versions.find((v) => v.version == paper_version.version)) {
                papers[paper.id].versions.push(paper_version)
            }

            const paper_field = {
                id: row.field_id,
                name: row.field_name,
                type: row.field_type,
                parents: [],
                children: [],
                createdDate: row.field_createdDate,
                updatedDate: row.field_updatedDate
            }

            if ( ! papers[paper.id].fields.find((f) => f.id == paper_field.id)) {
                papers[paper.id].fields.push(paper_field)
            }



            const paper_vote = {
                paperId: row.vote_paperId,
                userId: row.vote_userId,
                score: row.vote_score
            }

            if ( ! papers[paper.id].votes.find((v) => v.paperId == paper_vote.paperId && v.userId == paper_vote.userId) ) {
                papers[paper.id].votes.push(paper_vote)
            }
        })

        return papers
    }

    async selectPapers(where, params) {
        where = (where ? where : '')
        params = (params ? params : [])

        const sql = `
               SELECT 
                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft", papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",
                    paper_authors.user_id as author_id, paper_authors.author_order as author_order, paper_authors.owner as author_owner,
                    paper_versions.version as paper_version, paper_versions.filepath as paper_filepath,
                    fields.id as field_id, fields.name as field_name, fields.type as field_type, fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate",
                    paper_votes.paper_id as "vote_paperId", paper_votes.user_id as "vote_userId", paper_votes.score as vote_score
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN fields ON paper_fields.field_id = fields.id
                    LEFT OUTER JOIN paper_votes ON paper_votes.paper_id = papers.id
                ${where} 
                ORDER BY paper_authors.author_order asc, paper_versions.version desc
        `
        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return null
        } else {
            const papers = Object.values(this.hydratePapers(results.rows))
            for( const paper of papers) {
                for ( const author of paper.authors ) {
                    const users = await this.userDAO.selectUsers('WHERE users.id = $1', [ author.id])
                    author.user = users[0]
                    delete author.id
                }
            }
            return papers
        }
    }


}
