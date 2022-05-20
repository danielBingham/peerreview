/******************************************************************************
 * Authentication Controller
 *
 * Provides endpoints to authenticate a user.
 *
 * ***************************************************************************/

const AuthenticationService = require('../services/authentication');

module.exports = class AuthenticationController {

    constructor(database) {
        this.database = database;
        this.auth = new AuthenticationService();
    }

    getAuthentication(request, response) {
        try {
            if (request.session.user) {
                return response.status(200).json(request.session.user);
            } else {
                return response.status(204).json(null);
            }
        } catch (error) {
            return response.status(500).json({error: 'unknown-error'});
        }
    }

    async postAuthentication(request, response) {
        const credentials = request.body;

        try {
            const results = await this.database.query(
                'select id,password from users where email = $1',
                [ credentials.email ]
            );

            if (results.rows.length == 1 ) {
                const userMatch = results.rows[0];
                const passwords_match = this.auth.checkPassword(credentials.password, user.password);
                if (passwords_match) {
                    const user = this.userService.selectUsers(userMatch.id);
                    user.papers = this.userService.selectUserPapers(user.id);
                    request.session.user = user;
                    response.status(200).json(user);
                    return;
                } else {
                    response.status(403).json({error: 'authentication-failed'})
                    return;
                } 
            } else {
                response.status(403).json({error: 'authentication-failed'})
                return;
            }

        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown-error'})
            return;
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
        });
    }

};

