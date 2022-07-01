/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/

const AuthenticationService = require('../services/authentication');
const PaperDAO = require('../daos/paper');
const UserDAO = require('../daos/user');

module.exports = class UserController {

    constructor(database, logger) {
        this.database = database;
        this.logger = logger;
        this.auth = new AuthenticationService();
        this.paperDAO = new PaperDAO(database);
        this.userDAO = new UserDAO(database);
    }

    /**
     * GET /users/query
     *
     * Search through the users in the database using a query defined in the
     * query string parameters.
     */
    async queryUsers(request, response) {
        if ( request.query.name && request.query.name.length > 0) {
            try {
                const users = await this.userDAO.selectUsers('WHERE users.name ILIKE $1', [ request.query.name+"%" ]);
                return response.status(200).json(users);
            } catch (error) {
                this.logger.error(error);
                return response.status(500).json({ error: 'unknown' });
            }

        } else {
            return response.status(400).json({ error: 'no-query' });
        }
    }

    /**
     * GET /users
     *
     * Return a JSON array of all users in thethis.database.
     */
    async getUsers(request, response) {
        try {
            const users = await this.userDAO.selectUsers()
            return response.status(200).json(users);
        } catch (error) {
            this.logger.error(error);
            response.status(500).json({ error: 'unknown' });
            return;
        }
    }

    /**
     * POST /users
     *
     * Create a new user in the this.database from the provided JSON.
     */
    async postUsers(request, response) {
        const user = request.body;

        // If a user already exists with that email, send a 409 Conflict
        // response.
        //
        try {
            const userExistsResults = await this.database.query(
                'SELECT id, email FROM users WHERE email=$1',
                [ user.email ]
            );

            if (userExistsResults.rowCount > 0) {
                return response.status(409).json({error: 'user-exists'});
            }

            user.password = this.auth.hashPassword(user.password);

            const results = await this.database.query(`
                    INSERT INTO users (name, email, password, created_date, updated_date) 
                        VALUES ($1, $2, $3, now(), now()) 
                        RETURNING id

                `, 
                [ user.name, user.email, user.password ]
            );

            if ( results.rowCount == 0 ) {
                throw new Error('Insert user failed.')
            }

            const returnUser = await this.userDAO.selectUsers('WHERE users.id=$1', [results.rows[0].id]);
            return response.status(201).json(returnUser[0]);
        } catch (error) {
            this.logger.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     */
    async getUser(request, response) {

        try {
            const returnUsers = await this.userDAO.selectUsers('WHERE users.id = $1', [request.params.id])

            if ( returnUsers.length == 0 ) {
                return response.status(404).json([]);
            }

            return response.status(200).json(returnUsers[0]);
        } catch (error) {
            this.logger.error(error);
            return response.status(500).json({ error: 'unknown'});
        }
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     */
    async putUser(request, response) {
        try {
            const user = request.body;
            user.password = this.auth.hashPassword(user.password);

            const results = await this.database.query(`
                    UPDATE users SET name = $1 AND email = $2 AND password = $3 AND updated_date = now() 
                        WHERE id = $4 
                        RETURNING id
                `,
                [ user.name, user.email, user.password, request.params.id ]
            );

            if (results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnUser = await this.userDAO.selectUsers('WHERE users.id=$1', results.rows[0].id)
            if ( returnUser.length == 0 ) {
                throw new Error('Updated user somehow does not exist.')
            }
            return response.status(200).json(returnUser[0]);
        } catch (error) {
            this.logger.error(error);
            response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user given a partial set of fields in JSON.
     */
    async patchUser(request, response) {
        const user = request.body;
        user.id = request.params.id

        let sql = 'UPDATE users SET ';
        let params = [];
        let count = 1;
        for(let key in user) {
            if ( key == 'id' ) {
                continue
            }

            sql += key + ' = $' + count + ' and ';

            if ( key == 'password' ) {
                try {
                    user[key] = await this.auth.hashPassword(user[key]);
                } catch (error) {
                    this.logger.error(error);
                    return response.status(500).json({error: 'unknown'});
                }
            }

            params.push(user[key]);
            count = count + 1;
        }
        sql += 'updated_date = now() WHERE id = $' + count;
        params.push(user.id);

        try {
            const results = await this.database.query(sql, params);

            if ( results.rowCount == 0 ) {
                return response.status(404).json({error: 'no-resource'});
            }

            const returnUser = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])
            if ( ! returnUser ) {
                throw new Error('Updated user somehow does not exist!')
            }
            return response.status(200).json(returnUser[0]);
        } catch (error) {
            this.logger.error(error);
            response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     */
    async deleteUser(request, response) {

        try {
            const results = await this.database.query(
                'delete from users where id = $1',
                [ request.params.id ]
            );

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'});
            }

            return response.status(200).json({userId: request.params.id});
        } catch (error) {
            this.logger.error(error);
            return response.status(500).json({error: 'unknown'});
        }
    }

    /**
     * GET /user/:id/papers
     *
     * Get the papers a user is an author on.
     */
    async getUserPapers(request, response) {
        try {
            const userId = request.params.id
            const paperIds = await this.userDAO.selectUserPapers(userId)
            const papers = await this.paperDAO.selectPapers(paperIds)
            return response.status(200).json(papers)
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({error: 'unknown'})
        }
        
    }


}; 
