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
            const results = await this.database.query(`
               SELECT 
                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft", papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",
                    paper_authors.user_id as author_id, paper_authors.author_order as author_order, paper_authors.owner as author_owner,
                    users.name as author_name, users.email as author_email, users.created_date as "author_createdDate", users.updated_date as "author_updatedDate",
                    paper_versions.version as paper_version, paper_versions.filepath as paper_filepath
                FROM papers 
                    JOIN paper_authors ON papers.id = paper_authors.paper_id
                    JOIN users ON users.id = paper_authors.user_id
                    JOIN paper_versions on papers.id = paper_versions.paper_id
                    ORDER BY papers.id asc, paper_authors.author_order asc, paper_versions.version desc
            `);

            const resultObjects = this.processRows(results.rows);
            return response.status(200).json(resultObjects);

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
                    RETURNING id, title, is_draft as "isDraft", created_date as "createdDate", updated_date as "updatedDate"
                `, 
                [ paper.title, paper.isDraft ]
            );

            const returnedPaper = results.rows[0];
            console.log(returnedPaper);
            paper.id = returnedPaper.id;
            returnedPaper.authors = await this.insertAuthors(paper); 
            console.log(returnedPaper);
            return response.status(201).json(returnedPaper);
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
            console.log(request.file);
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
            let titleFilename = title.replaceAll(/\s/, '-');
            titleFilename = titleFilename.toLowerCase();
            titleFilename = sanitizeFilename(titleFilename);

            const filename = request.params.id + '-' + version + '-' + titleFilename;
            const filepath = 'public/uploads/papers/' + filename;
            fs.copyFileSync(request.file.path, filepath); 

            const updateResults = await this.database.query(`
                UPDATE paper_versions SET
                    filepath = $1
                WHERE paper_id = $2 and version = $3
                RETURNING paper_id, version, filepath
                `,
                [ filepath, request.params.id, version ]
            );

            if (updateResults.rowCount == 0 || updateResults.rows.length == 0) {
                console.error('Failed to update paper version with new filepath: ' + filepath);
                fs.rmSync(filepath);
                return response.status(500).json({ error: 'failed-filepath-update' });
            }

            fs.rmSync(request.file.path);
            return response.status(200).json({
                version: updateResults.rows[0].version,
                filepath: updateResults.rows[0].filepath
            });
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
           const results = await this.database.query(`
               SELECT 
                    papers.id as paper_id, papers.title as paper_title, papers.is_draft as "paper_isDraft", papers.created_date as "paper_createdDate", papers.updated_date as "paper_updatedDate",
                    paper_authors.user_id as author_id, paper_authors.author_order as author_order, paper_authors.owner as author_owner,
                    users.name as author_name, users.email as author_email, users.created_date as "author_createdDate", users.updated_date as "author_updatedDate",
                    paper_versions.version as paper_version, paper_versions.filepath as paper_filepath
                FROM papers 
                    JOIN paper_authors ON papers.id = paper_authors.paper_id
                    JOIN users ON users.id = paper_authors.user_id
                    JOIN paper_versions ON papers.id = paper_versions.paper_id
                WHERE papers.id=$1
                ORDER BY paper_authors.author_order asc, paper_versions.version desc
                `, 
               [request.params.id] 
           );

            if (results.rows.length == 0) {
                return response.status(404).json({});
            }

            const paper = this.processRows(results.rows)[0];
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
     * TODO Account for paper_versions.
     */
    async putPaper(request, response) {
        try {
            const paper = request.body;

            // Delete the authors so we can recreate them from the request.
            const deletionResults = await this.database.query(`
                DELETE FROM paper_authors WHERE paper_id = $1
                `,
                [ paper.id ]
            );

            // Update the paper.
            const results = await this.database.query(`
                UPDATE papers 
                    SET title = $1 AND filepath = $2 AND updated_date = now() 
                WHERE id = $3 
                RETURNING id, title, filepath, created_date as "createdDate", updated_date as "updatedDate"
                `,
                [ paper.title, paper.filepath, request.params.id ]
            );

            if (results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnedPaper = results.rows[0];

            // Reinsert the authors.
            returnedPaper.authors = await this.insertAuthors(paper);

            return response.status(200).json(returnedPaper);
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
        sql += ' RETURNING id, title, filepath, created_date as "createdDate", updated_date as "updatedDate"';

        params.push(paper.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnedPaper = results.rows[0];
            if ( paper.authors ) {
                // Delete the authors so we can recreate them from the request.
                const deletionResults = await this.database.query(`
                    DELETE FROM paper_authors WHERE paper_id = $1
                    `,
                    [ paper.id ]
                );
                returnedPaper.authors = await this.insertAuthors(paper);
            } else {
                returnedPaper.authors = await this.getAuthors(paper);
            }
            return response.status(200).json(returnedPaper);
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
    processRows(rows) {
        if ( rows.length == 0 ) {
            return []
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
            if ( ! papers[paper.id].versions.find((element) => element.version == paper_version.version)) {
                papers[paper.id].versions.push(paper_version);
            }
        });

        
        return Object.values(papers);
    }

    /**
     * Insert the authors for a paper.
     *
     * @throws Error Doesn't catch errors, so any errors returned by the database will bubble up.
     */
    async insertAuthors(paper) {
        const authorsReturned = [];
        for (const author of paper.authors) {
            const results = await this.database.query(`
                    INSERT INTO paper_authors (paper_id, user_id, author_order, owner)
                        VALUES ($1, $2, $3, $4)
                        RETURNING user_id as id, author_order as order, owner
                    `,
                [ paper.id, author.id, author.order, author.owner ]
            );

            if (results.rowCount == 0 || results.rows.length == 0) {
                throw new Error('Something went wrong with the author insertion.');
            }

            authorsReturned.push(results.rows[0]);
        }
        authorsReturned.sort(function(a,b) {
            return a.order - b.order;
        });
        return authorsReturned;
    }

    /**
     * Get authors for a paper.
     */
    async getAuthors(paper) {
        const results = await this.database.query(`
            SELECT
                paper_authors.author_order as order, paper_authors.owner as owner 
                users.id as user_id, users.name as user_name, users.email as user_email, users.created_date as "user_createdDate", users.updated_date as "user_updatedDate"
             FROM paper_authors
                JOIN users on users.id = paper_authors.user_id
             WHERE paper_authors.paper_id = $1
             ORDER BY paper_authors.author_order asc
             `,
            [ paper.id ]
        );

        if ( results.rowCount == 0 && results.rows.length == 0 ) {
            throw new Error('Something went wrong.  Paper had no authors.');
        }

        const authors = [];
        results.rows.forEach(function(row) {
            authors.push({
                order: row.order,
                owner: row.owner,
                user: {
                    id: row.user_id,
                    name: row.user_name,
                    email: row.user_email,
                    createdDate: row.user_createdDate,
                    updatedDate: row.user_updatedDate
                }
            });
        });
        return authors;
    }
}; 
