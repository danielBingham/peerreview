/******************************************************************************
 *     PaperController 
 *
 * Restful routes for manipulating papers.
 *
 ******************************************************************************/

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
            const results = await this.database.query('select * from root.papers');
            return response.status(200).json(results.rows);

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
            const results = await this.database.query(
                'INSERT INTO root.papers (title, file_path, owner_id, created_date, updated_date) VALUES ($1, $2, $3, now(), now()) RETURNING *', 
                [ paper.title, paper.file_path, paper.owner_id ]
            );
            const returned_paper= results.rows[0];
            return response.status(201).json(returned_paper);
        } catch (error) {
            console.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * GET /paper/:id
     *
     * Get details for a single paper in the database.
     */
    async getPaper(request, response) {

        try {
           const results = await this.database.query(
                'select * from root.papers where id=$1', 
               [request.params.id] 
           );

            if (results.rowCount == 0) {
                return response.status(404).json({});
            }

            const paper = results.rows[0];
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
     */
    async putPaper(request, response) {
        try {
            const paper = request.body;

            const results = await this.database.query(
                'UPDATE root.papers SET title = $1 AND file_path = $2 AND owner_id = $3 AND updated_date = now() WHERE id = $4 RETURNING *',
                [ paper.title, paper.file_path, paper.owner_id, request.params.id ]
            );

            if (results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnedPaper = results.rows[0];
            return response.status(200).json(returnedPaper);
        } catch (error) {
            console.error(error);
            response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * PATCH /paper/:id
     *
     * Update an existing user given a partial set of fields in JSON.
     */
    async patchPaper(request, response) {
        let paper = request.body;
        delete paper.id;

        let sql = 'UPDATE root.papers SET ';
        let params = [];
        let count = 1;
        for(let key in paper) {
            sql += key + ' = $' + count + ' and ';

            params.push(paper[key]);
            count = count + 1;
        }
        sql += 'updated_date = now() WHERE id = $' + count + ' RETURNING *';

        params.push(request.params.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returned_paper = results.rows[0];
            return response.status(200).json(returned_paper);
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
                'delete from root.papers where id = $1',
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
}; 
