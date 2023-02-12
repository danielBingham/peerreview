const backend = require('@danielbingham/peerreview-backend')
const AuthenticationService = backend.AuthenticationService

const AuthenticationController = require('../../../server/controllers/AuthenticationController')
const Logger = require('../../../server/logger')

describe('AuthenticationController', function() {
    
    const auth = new AuthenticationService()
    const logger = new Logger()
    // Disable logging.
    logger.level = -1

    // ====================== Fixture Data ====================================

    const submittedUsers = [
        {
            name: 'John Doe',
            email: 'john.doe@university.edu',
            password: 'password'
        },
        {
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            password: 'different-password'
        }
    ]

    const database = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    ]

    const expectedUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    ]

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const connection = {
        query: jest.fn()
    }

    class SessionReturnsUser {

        get user() {
            return expectedUsers[0]
        }
    }

    class SessionReturnsUndefined {

        get user() {
            return undefined 
        }
    }

    class SessionThrows {

        get user() {
            throw new Error('This is a test error.')
        }
    }

    beforeEach(function() {
        connection.query.mockReset()
    })

    xdescribe('.getAuthentication()', function() {
        it('should return 204 and null when no user is in the session', async function() {
            const request = {
                session: new SessionReturnsUndefined() 
            }

            const authenticationController = new AuthenticationController(connection, logger)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(204)
            expect(response.json.mock.calls[0][0]).toEqual(null)
        })

        it('should return 200 and the user when the session is populated', async function() {
            const request = {
                session: new SessionReturnsUser() 
            }

            const authenticationController = new AuthenticationController(connection, logger)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            const request = { 
                session: new SessionThrows()
            }

            const authenticationController = new AuthenticationController(connection, logger)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

    xdescribe('.postAuthentication()', function() {
        it('should hash the password and return 201 with the modified user', async function() {
            connection.query.mockReturnValueOnce({rowCount: 0, rows: []})
                .mockReturnValue({rowCount:1, rows: [ { id: database[0].id } ]})
                .mockReturnValue({rowCount:1, rows: [ database[0] ] })

            // Do this so that submittedUsers[0].password doesn't get
            // overwritten and we can use it in future tests.
            const submittedUser = {...submittedUsers[0] }
            const request = {
                body: submittedUser,
            }

            const response = new Response()
            const userController = new UserController(connection, logger)
            await userController.postUsers(request, response)

            const databaseCall = connection.query.mock.calls[1]
            expect(auth.checkPassword(submittedUsers[0].password, databaseCall[1][2])).toEqual(true)
            expect(response.status.mock.calls[0][0]).toEqual(201)
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            // Do this so that submittedUsers[0].password doesn't get
            // overwritten and we can use it in future tests.
            const submittedUser = {...submittedUsers[0] }
            const request = {
                body: submittedUser,
            }

            const response = new Response()
            const userController = new UserController(connection, logger)
            await userController.postUsers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

    xdescribe('.deleteAuthentication()', function() {
        it('should return 200 and the requested user', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})
            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const userController = new UserController(connection, logger)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
        })

        it('should return 404 when the user does not exist', async function() {
            connection.query.mockReturnValue({rowCount:0, rows: []})
            const request = {
                params: {
                    id: 3
                }
            }

            const response = new Response()
            const userController = new UserController(connection, logger)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(404)
            expect(response.json.mock.calls[0][0]).toEqual([])
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const userController = new UserController(connection, logger)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

})
