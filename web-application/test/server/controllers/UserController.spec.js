const backend = require('@danielbingham/peerreview-backend')
const AuthenticationService = backend.AuthenticationService
const DAOError = backend.DAOError

const UserController = require('../../../server/controllers/UserController')

const ControllerError = require('../../../server/errors/ControllerError')

xdescribe('UserController', function() {
    
    // ====================== Fixture Data ====================================

    const database = backend.DatabaseFixtures.database 
    const expectedUsers = backend.EntityFixtures.users 
    const expectedUncleanUsers = backend.EntityFixtures.usersUnclean

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new backend.Logger(),
        config: {
            postmark: {
                api_token: 'abde-fghi-jklm-nopq'
            }
        },
        database: {
            query: jest.fn()
        },
        queue: null,
        postmarkClient: {
            sendEmail: jest.fn()
        },
        features: new backend.FeatureFlags() 
    }

    const auth = new AuthenticationService(core)

    beforeEach(function() {
        core.database.query.mockReset()
    })

    describe('.getUsers()', function() {
        it('should return 200 and the users', async function() {
            core.database.query
                .mockReturnValueOnce({ rowCount: 1, rows: [ { count: 2 } ] })
                .mockReturnValueOnce({ 
                    rowCount: database.users[1].length + database.users[2].length, 
                    rows: [ ...database.users[1], ...database.users[2] ] 
                })

            const userController = new UserController(core)

            const request = {
                query: {}
            }

            const response = new Response()
            await userController.getUsers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                meta: {
                    page: 1,
                    count: 2,
                    pageSize: 20,
                    numberOfPages: 1
                },
                result: expectedUsers
            })
        })

        it('should pass any errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const userController = new UserController(core)

            const request = {
                query: {}
            }

            const response = new Response()
            try {
                await userController.getUsers(quest, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }

            expect.hasAssertions()
        })
    })

   describe('.postUsers()', function() {
       it('should hash the password and return 201 with the modified user', async function() {
           core.database.query.mockReturnValueOnce({rowCount: 0, rows: []}) //userExistsResults
               .mockReturnValueOnce({rowCount: 1, rows: [ { id: database.users[1].id } ]}) // insertUser
               .mockReturnValueOnce({rowCount: database.users[1].length, rows: database.users[1] }) // selectUsers
               .mockReturnValueOnce({rowCount: 1, rows: [ { id: 1 } ]}) // insertToken
               .mockReturnValueOnce({rowCount: 1, rows: [ { id: 1 } ]}) // initializeSettingsForUser
               .mockReturnValueOnce({rowCount: 1, rows: database.users[1] })

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()
           await userController.postUsers(request, response)

           const databaseCall = core.database.query.mock.calls[1]
           expect(auth.checkPassword(submittedUsers[0].password, databaseCall[1][4])).toEqual(true)
           expect(response.status.mock.calls[0][0]).toEqual(201)
           expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0])
       })
        
       it('should throw ControllerError(409) when the posted user already exists', async function() {
           core.database.query.mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, email: 'jwatson@university.edu' } ] })
           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()

           try {
               await userController.postUsers(request, response)
           } catch (error) {
               expect(error).toBeInstanceOf(ControllerError)
               expect(error.status).toEqual(409)
               expect(error.type).toEqual('user-exists')
           }

           expect.hasAssertions()
       })

       it('should throw DAOError if insertion fails', async function() {
           core.database.query.mockReturnValueOnce({rowCount: 0, rows: []})
               .mockReturnValueOnce({ rowCount: 0, rows: [] })

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()

           try {
               await userController.postUsers(request, response)
           } catch (error) {
               expect(error).toBeInstanceOf(DAOError)
               expect(error.type).toEqual('insertion-failure')
           }

           expect.hasAssertions()
       })

       it('should throw ControllerError(500) if we fail to find the posted user after insertion', async function() {
           core.database.query.mockReturnValueOnce({rowCount: 0, rows: []})
               .mockReturnValueOnce({rowCount: 1, rows: [ { id: database.users[1].id } ]})
               .mockReturnValueOnce({rowCount: 0, rows: []  })

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()

           try {
               await userController.postUsers(request, response)
           } catch (error) {
               expect(error).toBeInstanceOf(ControllerError)
               expect(error.status).toEqual(500)
               expect(error.type).toEqual('server-error')
           }

           expect.hasAssertions()
       })

       it('should throw DAOError if settings insertion fails', async function() {
           core.database.query.mockReturnValueOnce({rowCount: 0, rows: []})
               .mockReturnValueOnce({ rowCount: 1, rows: [ { id: database.users[1].id } ] })
               .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
               .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1 } ] })
               .mockReturnValueOnce({ rowCount: 0, rows: [ ] })

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()

           try {
               await userController.postUsers(request, response)
           } catch (error) {
               expect(error).toBeInstanceOf(DAOError)
               expect(error.type).toEqual('insertion-failure')
           }

           expect.hasAssertions()
       })

       it('should pass thrown errors on to the error handler', async function() {
           core.database.query.mockImplementation(function(sql, params) {
               throw new Error('Something went wrong!')
           })

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] }
           const request = {
               body: submittedUser,
               session: {}
           }

           const response = new Response()
           const userController = new UserController(core)
           userController.emailService.sendEmailConfirmation = jest.fn()
           try {
               await userController.postUsers(request, response)
           } catch (error) {
               expect(error).toBeInstanceOf(Error)
           }

           expect.hasAssertions()
       })
    })

    describe('.getUser()', function() {
        it('should return 200 and the requested user', async function() {
            core.database.query.mockReturnValueOnce({ 
                rowCount: database.users[1].length, 
                rows: database.users[1] 
            }) 

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
            try {
                await userController.getUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(404)
                expect(error.type).toEqual('not-found')
            }

            expect.hasAssertions()
        })

        it('should pass a thrown error on to the error handler', async function() {
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
            try {
                await userController.getUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
            expect.hasAssertions()
        })
    })

    describe('putUser()', function() {
        it('should return ControllerError(501)', async function() {
            const request = {
                params: {
                    id: 1,
                    body: { ...submittedUsers[0] }
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.putUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(501)
                expect(error.type).toEqual('not-implemented')
            }

            expect.hasAssertions()
        })

    })

    describe('patchUser()', function() {
        it('should construct update SQL and respond with status 200 and the updated user', async function() {
            core.database.query
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount:1, rows: [] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })


            const request = {
                body: { id: 1, bio: 'I am creditted with discovering the structure of DNA.' },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }
            const response = new Response()

            const userController = new UserController(core)
            await userController.patchUser(request, response)

            const expectedSQL = 'UPDATE users SET bio = $1, updated_date = now() WHERE id = $2'
            const expectedParams = [ request.body.bio, 1 ]

            const databaseCall = core.database.query.mock.calls[1]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(databaseCall[1]).toEqual(expectedParams)

            expect(response.json.mock.calls[0][0]).toEqual(expectedUncleanUsers[0])
        })

        it('should hash the password', async function() {
            const auth = new AuthenticationService(core)
            const oldPassword = 'foobar'

            core.database.query
                .mockReturnValueOnce({ rowCount: 1, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: auth.hashPassword(oldPassword) } ] })
                .mockReturnValueOnce({ rowCount:1, rows: [] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })

            // Patch user replaces password on the user object with the hash.
            // So we need to store it here if we want to check it after
            // `patchUser()` has run.
            const password = 'password'             
            const request = {
                body: {
                    id: 1,
                    password: password,
                    oldPassword: oldPassword
                },
                params: {
                    id: 1
                },
                session: {
                    user: expectedUsers[0]
                }
            }


            const response = new Response()
            const userController = new UserController(core)

            await userController.patchUser(request, response)

            const expectedSQL = 'UPDATE users SET password = $1, updated_date = now() WHERE id = $2'
            const databaseCall = core.database.query.mock.calls[2]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(await auth.checkPassword(password, databaseCall[1][0])).toEqual(true)

            expect(response.json.mock.calls[0][0]).toEqual(expectedUncleanUsers[0])
        })

        it('should throw ControllerError(403) if no user is authenticated', async function() {
            const request = {
                body: { id: 1, bio: 'I am creditted with discovering the structure of DNA.' },
                params: {
                    id: 1
                },
                session: {
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.patchUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw ControllerError(403) if the authenticated user is not the user being modified', async function() {
            const request = {
                body: { id: 1, bio: 'I am creditted with discovering the structure of DNA.' },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 2
                    }
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.patchUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw DAOEerror if the update attempt fails to modify any rows', async function() {
            core.database.query
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount:0, rows: [] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })

            const request = {
                body: { id: 1, bio: 'I am creditted with discovering the structure of DNA.' },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.patchUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(DAOError)
                expect(error.type).toEqual('update-failure')
            }

            expect.hasAssertions()
        })

        it('should throw ControllerError(500) if no user is found after update', async function() {
            core.database.query.mockReturnValueOnce({ rowCount:1, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const request = {
                body: { id: 1, bio: 'I am creditted with discovering the structure of DNA.' },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.patchUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(500)
                expect(error.type).toEqual('server-error')
            }

            expect.hasAssertions()
        })

    })

    describe('deleteUser()', function() {
        it('should return ControllerError(501)', async function() {
            const request = {
                params: {
                    id: 1,
                    body: { ...submittedUsers[0] }
                }
            }

            const response = new Response()
            const userController = new UserController(core)
            try {
                await userController.deleteUser(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(501)
                expect(error.type).toEqual('not-implemented')
            }

            expect.hasAssertions()
        })
    })

})
