
module.exports = class PaperService {

    constructor(database) {
        this.database = database
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

        const papers = {};

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
            };

            if ( ! papers[paper.id] ) {
                papers[paper.id] = paper;
            }

            const author = {
                user: {
                    id: row.author_id,
                    name: row.author_name,
                    email: row.author_email,
                    createdDate: row.author_createdDate,
                    updatedDate: row.author_updatedDate
                },
                order: row.author_order,
                owner: row.author_owner
            };

            if ( ! papers[paper.id].authors.find((a) => a.user.id == author.user.id)) {
                papers[paper.id].authors.push(author);
            }

            const paper_version = {
                filepath: row.paper_filepath,
                version: row.paper_version
            };
            // Ignore versions that haven't finished uploading.
            if (paper_version.version && ! papers[paper.id].versions.find((v) => v.version == paper_version.version)) {
                papers[paper.id].versions.push(paper_version);
            }

            const paper_field = {
                id: row.field_id,
                name: row.field_name,
                parentId: row.field_parentId,
                createdDate: row.field_createdDate,
                updatedDate: row.field_updatedDate
            }

            if ( ! papers[paper.id].fields.find((f) => f.id == paper_field.id)) {
                papers[paper.id].fields.push(paper_field)
            }

            const paper_vote = {
                paper_id: row.vote_paperId,
                user_id: row.vote_userId,
                score: row.vote_score
            }

            if ( ! papers[paper.id].votes.find((v) => v.paperId == paper_vote.paperId && v.userId == paper_vote.userId) ) {
                papers[paper.id].votes.push(paper_vote)
            }
        })

        return papers;
    }

    async selectPapers(ids) {
        let where = '';
        const params = [];
        if ( ids ) {
            where = 'WHERE papers.id = ANY($1::int[])';
            if ( Array.isArray(ids) ) {
                params.push(ids)
            } else {
                params.push([ids])
            }
        }

        const sql = `
               SELECT 
                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft", papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",
                    paper_authors.user_id as author_id, paper_authors.author_order as author_order, paper_authors.owner as author_owner,
                    users.name as author_name, users.email as author_email, users.created_date as "author_createdDate", users.updated_date as "author_updatedDate",
                    paper_versions.version as paper_version, paper_versions.filepath as paper_filepath,
                    fields.id as field_id, fields.name as field_name, fields.parent_id as "field_parentId", fields.created_date as "field_createdDate", fields.updated_date as "field_updatedDate",
                    paper_votes.paper_id as "vote_paperId", paper_votes.user_id as "vote_userId", paper_votes.score as vote_score
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN users ON users.id = paper_authors.user_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                    LEFT OUTER JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN fields ON paper_fields.field_id = fields.id
                    LEFT OUTER JOIN paper_votes ON paper_votes.paper_id = papers.id
                ${where} 
                ORDER BY paper_authors.author_order asc, paper_versions.version desc
        `;

        const results = await this.database.query(sql, params);

        if ( results.rows.length == 0 ) {
            return null
        } else {
            const papers = this.hydratePapers(results.rows)
            if ( ids && ! Array.isArray(ids) ) {
                return papers[ids];
            } else {
                return Object.values(papers);
            }
        }
    }


}
