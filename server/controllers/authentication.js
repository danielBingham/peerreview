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
            response.status(200).json({
                user: request.session.user
            });
        } else {
            response.status(204).send();
        }
    }

    authenticate(request, response) {
        const credentials = request.body;

        let auth = this.auth;
        this.database.query(
            'select * from users where email = ?',
            [ credentials.email ],
            function(error, results, fields) {
                if (error) {
                    console.log(error)
                    response.status(500).send()
                }

                const user = results[0];
                try {
                    const passwords_match = auth.checkPassword(credentials.password, user.password);
                    if (passwords_match) {
                        delete user.password
                        request.session.user = user;
                        response.status(200).json({
                            user: user
                        });
                    } else {
                        response.status(403).send()
                    } 
                } catch (error) {
                    console.log(error);
                    response.status(500).send()
                }

            }
        );
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

