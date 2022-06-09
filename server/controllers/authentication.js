/******************************************************************************
 * Authentication Controller
 *
 * Provides endpoints to authenticate a user.
 *
 * ***************************************************************************/

const AuthenticationService = require('../services/authentication')
const UserService = require('../services/user')
const PaperService = require('../services/paper')

module.exports = class AuthenticationController {

    constructor(database) {
        this.database = database
        this.auth = new AuthenticationService()
        this.userService = new UserService(database)
        this.paperService = new PaperService(database)
    }

    getAuthentication(request, response) {
        try {
            if (request.session.user) {
                return response.status(200).json(request.session.user)
            } else {
                return response.status(204).json(null)
            }
        } catch (error) {
            return response.status(500).json({error: 'unknown'})
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
                    const users = await this.userService.selectUsers('WHERE id=$1', [userMatch.id])
                    const user = users[0]
                    const paperIds = await this.userService.selectUserPapers(user.id)
                    if ( paperIds ) {
                        user.papers = await this.paperService.selectPapers(paperIds)
                    } else {
                        user.papers = null
                    }
                    request.session.user = user
                    response.status(200).json(user)
                    return
                } else {
                    response.status(403).json({error: 'authentication-failed'})
                    return
                } 
            } else {
                response.status(403).json({error: 'authentication-failed'})
                return
            }

        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown-error'})
            return
        }
    }

    deleteAuthentication(request, response) {
        request.session.destroy(function(error) {
            if (error) {
                console.log(error)
                response.status(500).json({error: 'unknown-error'})
            } else {
                response.status(200).json(null)
            }
        })
    }

}

