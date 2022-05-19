const fs = require('fs');
const sanitizeFilename = require('sanitize-filename');

/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/


/**
 *
 */
module.exports = class PaperController {

    constructor(database) {
        this.database = database;
    }


    /**
     * GET /papers
     *
     * Return a JSON array of all papers in the database.
     */
    async getPapers(request, response) {
        try {
            const papers = await this.selectPapers();
            return response.status(200).json(papers);
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'unknown' });
            return;
        }
    }

    /**
     * POST /papers
     *
     * Create a new paper in the database from the provided JSON.
     */
    async postPapers(request, response) {
        const paper = request.body;

        try {
            const results = await this.database.query(`
                INSERT INTO papers (title, is_draft, created_date, updated_date) 
                    VALUES ($1, $2, now(), now()) 
                    RETURNING id
                `, 
                [ paper.title, paper.isDraft ]
            );
            if ( results.rows.length == 0 ) {
                console.error('Failed to insert a paper.');
                return response.status(500).json({error: 'unknown'});
            }
            console.log(results.rows);

            paper.id = results.rows[0].id;

            await this.insertAuthors(paper); 

            console.log(paper);

            const returnPaper = await this.selectPapers(paper.id);
            console.log('postPapers: returnPaper');
            console.log(returnPaper);
            return response.status(201).json(returnPaper);
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * POST /paper/:id/upload
     *
     * Upload a version of a paper.
     */
    async uploadPaper(request, response) {
        try {
            const titleResults = await this.database.query(`
                SELECT
                    title
                FROM papers
                WHERE id = $1
                `,
                [ request.params.id ]
            );

            if ( titleResults.rows.length == 0 ) {
                console.error('Attempt to upload paper that does not exist.');
                fs.rmSync(request.file.path);
                return response.status(404).json({ error: 'no-paper' });
            }

            const versionResults = await this.database.query(`
                INSERT INTO paper_versions
                    (paper_id, filepath)
                VALUES
                    ($1, $2)
                RETURNING 
                    paper_id, version, filepath
                `,
                [request.params.id, request.file.path]
            );

            if (versionResults.rows.length == 0) {
                console.error('Insert paper version failed silently for ' + paper_id + ' and ' + request.file.path);
                fs.rmSync(request.file.path);
                return response.status(500).json({ error: 'unknown' });
            }

            const version = versionResults.rows[0].version;

            const title = titleResults.rows[0].title;
            let titleFilename = title.replaceAll(/\s/g, '-');
            titleFilename = titleFilename.toLowerCase();
            titleFilename = sanitizeFilename(titleFilename);

            const base = 'public'
            // TODO Properly check the MIME type and require PDF.  Possibly use Node Mime.
            const filename = request.params.id + '-' + version + '-' + titleFilename + '.pdf';
            const filepath = '/uploads/papers/' + filename;
            fs.copyFileSync(request.file.path, base+filepath); 

            const updateResults = await this.database.query(`
                UPDATE paper_versions SET
                    filepath = $1
                WHERE paper_id = $2 and version = $3
                `,
                [ filepath, request.params.id, version ]
            );

            if (updateResults.rowCount == 0) {
                console.error('Failed to update paper version with new filepath: ' + filepath);
                fs.rmSync(base + filepath);
                return response.status(500).json({ error: 'failed-filepath-update' });
            }

            fs.rmSync(request.file.path);

            const returnPaper = await this.selectPapers(request.params.id);
            return response.status(200).json(returnPaper);
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: 'unknown' });
        }
    }

    /**
     * GET /paper/:id
     *
     * Get details for a single paper in the database.
     */
    async getPaper(request, response) {

        try {
            const paper = await this.selectPapers(request.params.id);
            return response.status(200).json(paper);
        } catch (error) {
            console.error(error);
            return response.status(500).send();
        }
    }

    /**
     * PUT /paper/:id
     *
     * Replace an existing paper wholesale with the provided JSON.
     *
     * TODO Account for paper_versions
     */
    async putPaper(request, response) {
        try {
            const paper = request.body;
            paper.id = request.params.id;

            // Update the paper.
            const results = await this.database.query(`
                UPDATE papers 
                    SET title = $1 AND is_draft=$2 AND updated_date = now() 
                WHERE id = $3 
                `,
                [ paper.title, paper.isDraft, paper.id ]
            );

            if (results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'});
            }

            // Delete the authors so we can recreate them from the request.
            const deletionResults = await this.database.query(`
                DELETE FROM paper_authors WHERE paper_id = $1
                `,
                [ paper.id ]
            );

            // Reinsert the authors.
            await this.insertAuthors(paper);

            const returnPaper = await this.selectPapers(paper.id);
            return response.status(200).json(returnPaper);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * PATCH /paper/:id
     *
     * Update an existing paper given a partial set of fields in JSON.
     *
     * TODO Account for paper_versions.
     */
    async patchPaper(request, response) {
        let paper = request.body;

        // We want to use the params.id over any id in the body.
        paper.id = request.params.id

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'id', 'authors', 'createdDate', 'updatedDate' ];

        let sql = 'UPDATE papers SET ';
        let params = [];
        let count = 1;
        for(let key in paper) {
            if (ignoredFields.includes(key)) {
                continue;
            }
            sql += key + ' = $' + count + ' and ';

            params.push(paper[key]);
            count = count + 1;
        }
        sql += 'updated_date = now() WHERE id = $' + count;

        params.push(paper.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'});
            }

            if ( paper.authors ) {
                // Delete the authors so we can recreate them from the request.
                const deletionResults = await this.database.query(`
                    DELETE FROM paper_authors WHERE paper_id = $1
                    `,
                    [ paper.id ]
                );
                await this.insertAuthors(paper);
            } 

            const returnPaper = await this.selectPaper(paper.id);
            return response.status(200).json(returnPaper);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /paper/:id
     *
     * Delete an existing paper.
     */
    async deletePaper(request, response) {

        try {
            const results = await this.database.query(
                'delete from papers where id = $1',
                [ request.params.id ]
            );

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json({paperId: request.params.id});
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
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
                versions: [] 
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

            // NOTE: This little trick only works because the authors are coming
            // back in ascending order from the query.  IE in order 1, 2, 3, 4,
            // etc, such that length will always be less than the order of the next
            // item we want to add to the array.  If we change the order of the
            // author rows, this will break.
            if (author.order > papers[paper.id].authors.length) {
                papers[paper.id].authors.push(author);
            }

            const paper_version = {
                filepath: row.paper_filepath,
                version: row.paper_version
            };
            if (paper_version.version && ! papers[paper.id].versions.find((element) => element.version == paper_version.version)) {
                papers[paper.id].versions.push(paper_version);
            }
        });

        return papers;
    }

    async selectPapers(id) {
        let where = '';
        if (id) {
            where = 'WHERE papers.id=$1';
        }
        console.log(id);

        const sql = `
               SELECT 
                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft", papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",
                    paper_authors.user_id as author_id, paper_authors.author_order as author_order, paper_authors.owner as author_owner,
                    users.name as author_name, users.email as author_email, users.created_date as "author_createdDate", users.updated_date as "author_updatedDate",
                    paper_versions.version as paper_version, paper_versions.filepath as paper_filepath
                FROM papers 
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    LEFT OUTER JOIN users ON users.id = paper_authors.user_id
                    LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
                ${where} 
                ORDER BY paper_authors.author_order asc, paper_versions.version desc
        `;

        const params = [];
        if (id) {
            params.push(id)
        }

        const results = await this.database.query(sql, params);

        console.log(results.rows);

        if ( results.rows.length == 0 ) {
            return null
        } else {
            const papers = this.hydratePapers(results.rows)
            if (id ) {
                return papers[id];
            } else {
                return Object.values(papers);
            }
        }
    }

    /**
     * Insert the authors for a paper.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertAuthors(paper) {
        let sql =  `INSERT INTO paper_authors (paper_id, user_id, author_order, owner) VALUES `;
        let params = [];

        let count = 1;
        for (const author of paper.authors) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3})` + (count < paper.authors.length ? ', ' : '');
            params.push(paper.id, author.user.id, author.order, author.owner)
            count = count+4;
        }

        const results = await this.database.query(sql, params);

        if (results.rowCount == 0 )  {
            throw new Error('Something went wrong with the author insertion.');
        }
    }
}; 
