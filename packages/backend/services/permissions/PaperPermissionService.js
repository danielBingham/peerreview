
module.exports = class PaperPermissionService {

    constructor(core) {
        this.core = core
    }

    /**
     * Create the roles for the paper.
     */
    async createRoles(paper) {
        await this.core.database.query(`
        INSERT INTO roles (name, short_description, description, type, is_owner, paper_id)
            VALUES ('corresponding-author', 'Corresponding Author', 'An author responsible for corresponding on submissions.  Has full permissions over the paper.', 'author', true, $1),
            ('author', 'Author', 'An author on the paper.', 'author', false, $1)
        `, [ paper.id ])

        const correspondingAuthorRoleResults = await this.core.database.query(`
            SELECT id FROM roles WHERE name = 'corresponding-author' AND paper_id = $1
        `, [ paper.id ])

        const correspondingAuthorRoleId = correspondingAuthorRoleResults.rows[0].id

        await this.core.database.query(`
            INSERT INTO role_permissions
                    (role_id, permission, paper_id)
                VALUES
                    ($1, 'Paper:view', $2),
                    ($1, 'Paper:edit', $2),
                    ($1, 'Paper:delete', $2),
                    ($1, 'Paper:identify', $2),
                    ($1, 'Paper:review', $2),
                    ($1, 'Paper:comment', $2),
                    ($1, 'Paper:versions:create', $2)
        `, [ correspondingAuthorRoleId, paper.id ])

        const authorRoleResults = await this.core.database.query(`
            SELECT id FROM roles WHERE name = 'author' AND paper_id = $1
        `, [ paper.id ])

        const authorRoleId = authorRoleResults.rows[0].id

        await this.core.database.query(`
            INSERT INTO role_permissions
                    (role_id, permission, paper_id)
                VALUES
                    ($1, 'Paper:view', $2),
                    ($1, 'Paper:identify', $2),
                    ($1, 'Paper:review', $2),
                    ($1, 'Paper:comment', $2)
        `, [ authorRoleId, paper.id ])
    }

    async assignRoles(paper) {
        const roleResults = await this.core.database.query(`
            SELECT id, name FROM roles WHERE paper_id = $1
        `, [ paper.id ])

        const roleMap = roleResults.rows.reduce((map, row) => map[row.name] = row.id, {})

        let sql = `INSERT INTO user_roles (role_id, user_id) VALUES `
        let params = []
        let count = 1
        for(const author of paper.authors) {
            if ( count > 1 ) {
                sql += ', '
            }
            sql += `($${count}, $${count})`
            params.push(map[author.role], author.userId)
        }

        await this.core.database.query(sql, params)
    }

}
