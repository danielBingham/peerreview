module.exports = class SessionService {

    constructor(core) {
        this.core = core
    }


    async getSession(userId) {
        const results = await this.core.database.query(`
            SELECT sid, sess FROM session 
                WHERE (sess #>> '{user,id}')::bigint = $1
        `, [ userId ])

        let session = null
        if ( results.rows.length > 0 ) {
            session = {
                id: results.rows[0].sid,
                data: results.rows[0].sess
            }
        }

        return session
    }

    async setSession(session) {
        const results = await this.core.database.query(`
            UPDATE session SET sess = $1 WHERE sid = $2
        `, [ session.data, session.id])

        if ( results.rowCount <= 0 ) {
            throw new Error('Failed to update session!')
        }

    }
}
