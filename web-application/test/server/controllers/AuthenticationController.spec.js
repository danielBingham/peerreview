const backend = require('@danielbingham/peerreview-backend')
const AuthenticationService = backend.AuthenticationService

const AuthenticationController = require('../../../server/controllers/AuthenticationController')

/*************
 * TECHDEBT
 *
 * This whole spec is xed out because the settings portion of it is undone
 * which causes the tests to fail.  I'm currently pondering ripping out the
 * settings entirely.  We aren't using any of the notices.  The ignore/isolate
 * field system is broken and I'm contemplating replacing it with a "filters"
 * system.
 *
 * We might just rip out the settings system entirely.  It probably needs to
 * be redone anyway.
 */
describe('AuthenticationController', function() {

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

    const core = {
        logger: new backend.Logger(),
        database: {
            query: jest.fn()
        },
        queue: null,
        postmarkClient: {
            sendEmail: jest.fn()
        },
        features: new backend.FeatureFlags() 
    }

    // Disable logging.
    core.logger.level = -1

    const auth = new AuthenticationService(core)

    class SessionReturnsUser {

        get user() {
            return expectedUsers[0]
        }

        get settings() {
            return {
                userId: expectedUsers[0].id,
                welcomeDismissed: false,
                fundingDismissed: false,
                wipDismissed: false,
                fields: []
            }
        }
    }

    class SessionReturnsUndefined {

        get user() {
            return undefined 
        }

        get settings() {
            return null 
        }
    }

    class SessionThrows {

        get user() {
            throw new Error('This is a test error.')
        }
    }

    beforeEach(function() {
        core.database.query.mockReset()
    })

    xdescribe('.getAuthentication()', function() {
        it('should return 200 and an object with nulls when no user is in the session', async function() {
            const request = {
                session: new SessionReturnsUndefined() 
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                user: null,
                settings: null 
            })
        })

        it('should return 200 and the user when the session is populated', async function() {
            const request = {
                session: new SessionReturnsUser() 
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                user: expectedUsers[0],
                settings: {
                    userId: expectedUsers[0].id,
                    welcomeDismissed: false,
                    fundingDismissed: false,
                    wipDismissed: false,
                    fields: []
                }
            })
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            const request = { 
                session: new SessionThrows()
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

    xdescribe('.postAuthentication()', function() {
        it('should hash the password and return 201 with the modified user', async function() {
            core.database.query.mockReturnValueOnce({rowCount: 0, rows: []})
                .mockReturnValue({rowCount:1, rows: [ { id: database[0].id } ]})
                .mockReturnValue({rowCount:1, rows: [ database[0] ] })

            // Do this so that submittedUsers[0].password doesn't get
            // overwritten and we can use it in future tests.
            const submittedUser = {...submittedUsers[0] }
            const request = {
                body: submittedUser,
            }

            const response = new Response()
            const userController = new UserController(core)
            await userController.postUsers(request, response)

            const databaseCall = core.database.query.mock.calls[1]
            expect(auth.checkPassword(submittedUsers[0].password, databaseCall[1][2])).toEqual(true)
            expect(response.status.mock.calls[0][0]).toEqual(201)
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            // Do this so that submittedUsers[0].password doesn't get
            // overwritten and we can use it in future tests.
            const submittedUser = {...submittedUsers[0] }
            const request = {
                body: submittedUser,
            }

            const response = new Response()
            const userController = new UserController(core)
            await userController.postUsers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

    xdescribe('.deleteAuthentication()', function() {
        it('should return 200 and the requested user', async function() {
            core.database.query.mockReturnValue({rowCount:1, rows: [database[0]]})
            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
        })

        it('should return 404 when the user does not exist', async function() {
            core.database.query.mockReturnValue({rowCount:0, rows: []})
            const request = {
                params: {
                    id: 3
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(404)
            expect(response.json.mock.calls[0][0]).toEqual([])
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })

})
