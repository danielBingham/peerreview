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

    getAuthenticated(request, response) {
        if (request.session.user) {
            response.status(200).json(request.session.user);
        } else {
            response.status(204).send();
        }
    }

    async authenticate(request, response) {
        const credentials = request.body;

        try {
            const results = await this.database.query(
                'select * from root.users where email = $1',
                [ credentials.email ]
            );

            if (results.rowCount > 0) {
                const user = results.rows[0];
                const passwords_match = this.auth.checkPassword(credentials.password, user.password);
                if (passwords_match) {
                    delete user.password
                    request.session.user = user;
                    response.status(200).json(user);
                    return;
                } else {
                    response.status(403).json({error: 'login-failed'})
                    return;
                } 
            } else {
                response.status(403).json({error: 'login-failed'})
                return;
            }

        } catch (error) {
            console.error(error)
            response.status(500).json({error: 'unknown'})
            return;
        }
    }

    logout(request, response) {
        request.session.destroy(function(error) {
            if (error) {
                console.log(error)
                response.status(500).send()
            } else {
                response.status(200).send()
            }
        });
    }

};

