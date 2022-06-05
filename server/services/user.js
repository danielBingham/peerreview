
module.exports = class UserService {


    constructor(database) {
        this.database = database
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows) {
        if ( rows.length == 0 ) {
            return null 
        }

        const users = {};

        for( const row of rows ) {
            const user = {
                id: row.id,
                name: row.name,
                email: row.email,
                createdDate: row.createdDate,
                updatedDate: row.updatedDate
            }
            users[user.id] = user
        }

        return users;
    }

    async selectUsers(where, params) {
        if ( ! where ) {
            where = ''
        } 
        if ( ! params ) {
            params = []
        }

        const sql = `
                SELECT 
                    id, name, email, created_date as "createdDate", updated_date as "updatedDate"
                FROM users
                ${where} 
        `;

        const results = await this.database.query(sql, params);

        if ( results.rows.length == 0 ) {
            return null 
        } else {
            const users = this.hydrateUsers(results.rows)
            return Object.values(users);
        }
    }

    async selectUserPapers(id) {

        console.log('selectUserPapers');
        const sql = `
            SELECT DISTINCT
                papers.id
            FROM papers
                LEFT OUTER JOIN paper_authors on papers.id = paper_authors.paper_id
            WHERE paper_authors.user_id = $1
        `

        const results = await this.database.query(sql, [ id ])

        if ( results.rows.length == 0) {
            return null
        }

        let paperIds = []
        for ( const row of results.rows ) {
            paperIds.push(row.id)
        }
        return paperIds
    }

}
