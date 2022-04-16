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
            response.json({
                success: true,
                user: request.session.user
            });
        } else {
            response.json({
                success: true,
                user: null
            })
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
                    throw error;
                }

                const user = results[0];
                try {
                    const passwords_match = auth.checkPassword(credentials.password, user.password);
                    if (passwords_match) {
                        delete user.password
                        request.session.user = user;
                        response.json({
                            success: true,
                            user: user
                        });
                    } else {
                        response.json({
                            success: false
                        });
                    }
                } catch (error) {
                    console.log(error);
                    response.json({
                        success: false
                    })
                }

            }
        );
    }

    logout(request, response) {
        request.session.destroy(function(error) {
            if (error) {
                console.log(error)
                response.json({
                    success: false,
                    error: error
                })
            } else {
                response.json({
                    success: true
                })
            }
        });
    }

};

