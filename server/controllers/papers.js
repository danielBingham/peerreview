const fs = require('fs');
const sanitizeFilename = require('sanitize-filename');
const PaperService = require('../services/paper.js');

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
        this.paperService = new PaperService(database);
    }


    /**
     * GET /papers
     *
     * Return a JSON array of all papers in the database.
     */
    async getPapers(request, response) {
        try {
            const papers = await this.paperService.selectPapers();
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
            paper.id = results.rows[0].id;
            await this.insertAuthors(paper); 

            const returnPaper = await this.paperService.selectPapers(paper.id);
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

            const returnPaper = await this.paperService.selectPapers(request.params.id);
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
            const paper = await this.paperService.selectPapers(request.params.id);
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

            const returnPaper = await this.paperService.selectPapers(paper.id);
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
     * Insert the authors for a paper.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertAuthors(paper) {
        let sql =  `INSERT INTO paper_authors (paper_id, user_id, author_order, owner) VALUES `;
        let params = [];

        let count = 1;
        let authorCount = 1;
        for (const author of paper.authors) {
            sql += `($${count}, $${count+1}, $${count+2}, $${count+3})` + (authorCount < paper.authors.length ? ', ' : '')
            params.push(paper.id, author.user.id, author.order, author.owner)
            count = count+4
            authorCount++
        }

        const results = await this.database.query(sql, params);

        if (results.rowCount == 0 )  {
            throw new Error('Something went wrong with the author insertion.');
        }
    }
}; 
