/******************************************************************************
 * Authentication Controller
 *
 * Provides endpoints to authenticate a user.
 *
 * ***************************************************************************/

const AuthenticationService = require('../services/authentication')
const UserDAO = require('../daos/user')

module.exports = class AuthenticationController {

    constructor(database) {
        this.database = database
        this.auth = new AuthenticationService()
        this.userDAO = new UserDAO(database)
    }

    getAuthentication(request, response) {
        try {
            if (request.session.user) {
                return response.status(200).json(request.session.user)
            } else {
                return response.status(204).json(null)
            }
        } catch (error) {
            return response.status(500).json({error: 'server-error'})
        }
    }

    async postAuthentication(request, response) {
        const credentials = request.body

        try {
            const results = await this.database.query(
                'select id,password from users where email = $1',
                [ credentials.email ]
            )

            if (results.rows.length == 1 ) {
                const userMatch = results.rows[0]
                const passwords_match = this.auth.checkPassword(credentials.password, userMatch.password)
                if (passwords_match) {
                    const users = await this.userDAO.selectUsers('WHERE users.id=$1', [userMatch.id])
                    if ( ! users ) {
                        this.logger.error('Failed to get authenticated user!')
                        return response.status(403).json({ error: 'authentication-failed' })
                    } else {
                        request.session.user = users[0]
                        return response.status(200).json(request.session.user)
                    }
                } else {
                    return response.status(403).json({error: 'authentication-failed'})
                } 
            } else {
                return response.status(403).json({error: 'authentication-failed'})
            }

        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'server-error'})
            return
        }
    }

    /**
     * Can be used to check a user's authentication with out modifying the
     * session.
     */
    async patchAuthentication(request, response) {
        const credentials = request.body

        try {
            const results = await this.database.query(
                'select id,password from users where email = $1',
                [ credentials.email ]
            )

            if (results.rows.length == 1 ) {
                const userMatch = results.rows[0]
                const passwords_match = this.auth.checkPassword(credentials.password, userMatch.password)
                if (passwords_match) {
                    const users = await this.userDAO.selectUsers('WHERE users.id=$1', [userMatch.id])
                    if ( ! users ) {
                        this.logger.error('Failed to get authenticated user!')
                        return response.status(403).json({ error: 'authentication-failed' })
                    } else {
                        return response.status(200).json(users[0])
                    }
                } else {
                    return response.status(403).json({error: 'authentication-failed'})
                } 
            } else {
                return response.status(403).json({error: 'authentication-failed'})
            }

        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'server-error'})
            return
        }
        
    }

    deleteAuthentication(request, response) {
        request.session.destroy(function(error) {
            if (error) {
                console.log(error)
                response.status(500).json({error: 'server-error'})
            } else {
                response.status(200).json(null)
            }
        })
    }

}

