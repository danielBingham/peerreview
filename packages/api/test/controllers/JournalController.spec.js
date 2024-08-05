const backend = require('@danielbingham/peerreview-backend')
const DAOError = backend.DAOError

const JournalController = require('../../../server/controllers/JournalController')

const ControllerError = require('../../../server/errors/ControllerError')

describe('JournalController', function() {

    // ====================== Fixture Data ====================================

    const database = backend.DatabaseFixtures.database
    const expectedJournals = backend.EntityFixtures.journals

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new backend.Logger(),
        config: {
            s3: {
                bucket_url: '',
                access_id: '',
                access_key: '',
                bucket: ''
            },
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

    // Disable logging.
    core.logger.level = -1

    beforeEach(function() {
        core.database.query.mockReset()
        core.logger.level = -1 
    })

    describe('.getJournals()', function() {
        it('should return 200 and the list of journals', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 11, rows: [ ...database.journals[1], ...database.journals[2], ...database.journals[3], ...database.journals[4] ]}) 
                .mockReturnValueOnce({ rowCount: 1, rows: [ { count: 4 } ]})
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 


            const journalController = new JournalController(core)

            const request = {
                session: {},
                query: {}
            }

            const response = new Response()
            await journalController.getJournals(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedJournals)
        })

        it('should pass any errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const journalController = new JournalController(core)

            const request = {
                session: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.getJournals(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }

            expect.hasAssertions()
        })
    })

    describe('.postJournals()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.postJournals(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-owner users', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                body: {
                    name: 'Journal One',
                    description: 'A test journal.',
                    members: [
                        {
                            userId: 1,
                            permissions: 'owner'
                        }
                    ]
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalController.postJournals(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized:not-owner')
            }

            expect.hasAssertions()
        })

        it('should return a 201 and the created journal', async function() {
            // We need to mock the pool's client functionality.
            const client = {
                query: jest.fn(),
                release: jest.fn()
            }
            core.database.connect = function() {
                return client  
            }

            
            client.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) // Transaction BEGIN
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] }) // insertJournal
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // insertJournalUser
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) // COMMIT
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            journalController.notificationService = {
                sendNotifications: jest.fn()
            }

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                body: {
                    name: 'Journal One',
                    description: 'A test journal',
                    members: [
                        {
                            userId: 1,
                            permissions: 'owner'
                        }
                    ]
                },
                query: {}
            }

            const response = new Response()
            await journalController.postJournals(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(201)
            expect(response.json.mock.calls[0][0]).toEqual({
                entity: expectedJournals.dictionary[1],
                relations: expectedJournals.relations 
            })
        })
    })

    describe('.getJournal', function() {
        it('should return 200 and the requested journal', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            await journalController.getJournal(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({ 
                entity: expectedJournals.dictionary[1],
                relations: expectedJournals.relations 
            })

        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalController.getJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })
    })

    describe('.putJournal()', function() {
        it('should return 501 not implemented', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalController.putJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(501)
                expect(error.type).toBe('not-implemented')
            }

            expect.hasAssertions()
        })
    })

    describe('.patchJournal()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.patchJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.patchJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return 403 when the authenticated user is not a journal owner', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.patchJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized:not-owner')
            }

            expect.hasAssertions()
        })

        it('should return 201 and the patched journal', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) // Get existing journal
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // UPDATE journals ...
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            await journalController.patchJournal(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(201)
            expect(response.json.mock.calls[0][0]).toEqual({
                entity: expectedJournals.dictionary[1],
                relations: expectedJournals.relations
            })

        })
    })

    describe('.deleteJournal()', function() {
        it('should throw 401 not-authenticated if no user is authenticated.', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.deleteJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should throw 403 not-authorized if the authenticated user is not an owner of the journal', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            try {
                await journalController.deleteJournal(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized:not-owner')
            }

            expect.hasAssertions()
        })

        it('should return 200 when the journal was successfully deleted', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    id: 1
                },
                body: {},
                query: {}
            }

            const response = new Response()
            await journalController.deleteJournal(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

    describe('.postJournalMembers()', function() {
        it('should throw 401 not-authenticated if no user is authenticated.', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.postJournalMembers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.postJournalMembers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should throw 403 not-authorized if the authenticated user is not an owner or editor', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            try {
                await journalController.postJournalMembers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw 403 not-authorized if the authenticated user is not an owner and is trying to add an owner', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.postJournalMembers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw 403 not-authorized if the authenticated user is not an owner and is trying to add an editor', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'editor'
                }
            }

            const response = new Response()
            try {
                await journalController.postJournalMembers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 when the authenticated user is an editor adding a reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Notifications
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 2 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })
                
                // relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            await journalController.postJournalMembers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an owner adding an reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Notifications
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 2 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })
                
                // relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            await journalController.postJournalMembers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an owner adding an editor', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Notifications
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 2 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })
                
                // relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'editor'
                }
            }

            const response = new Response()
            await journalController.postJournalMembers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an owner adding an owner', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Notifications
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 2 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })

                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ email: '' }] })
                
                // relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'owner'
                }
            }

            const response = new Response()
            await journalController.postJournalMembers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

    describe('.patchJournalMember()', function() {
        it('should throw 400 if no request body is included (1.)', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    userId: 4
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(400)
                expect(error.type).toBe('no-patch')
            }

            expect.hasAssertions()
        })

        it('should throw 401 if no user is authenticated (2.)', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    userId: 3
                },
                body: {
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return 404 when Journal(:journalId) does not exist (3.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                },
                body: {
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should throw 403 if the authenticated user is not a member of Journal(:journalId) (4.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                },
                body: {
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw 400 if the target User(:userId) is not a member of Journal(:journalId) (5.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 4
                },
                body: {
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(400)
                expect(error.type).toBe('not-member')
            }

            expect.hasAssertions()
        })

        it('should throw 403 not-authorized if the authenticated user is not an owner (6.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                },
                body: {
                    permissions: 'owner'
                }
            }

            const response = new Response()
            try {
                await journalController.patchJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 when the authenticated user is an owner', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                
                // relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                },
                body: {
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            await journalController.patchJournalMember(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

    describe('.deleteJournalMember()', function() {
        it('should throw 401 not-authenticated if no user is authenticated (Permissions 1.)', async function() {
            const journalController = new JournalController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist (Permissions 2.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows:[] }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 3,
                    userId: 3
                }  
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should throw 403 if the authenticated user is not a member of Journal(:journalId) (Permissions 3.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw 400 if Target User(:userId) is not a member of Journal(:journalId) (Permissions 4.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                body: {
                    userId: 4,
                    permissions: 'reviewer'
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(400)
                expect(error.type).toBe('not-member')
            }

            expect.hasAssertions()
        })

        it('should throw 403 if the authenticated user is a Reviewer attempting to delete a reviewer (Permissions 5a.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should throw 403 if the authenticated user is an Editor attempting to delete an Owner (Permissions 5b.)', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1,
                    userId: 1
                }
            }

            const response = new Response()
            try {
                await journalController.deleteJournalMember(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 when the authenticated user is an Editor deleting a Reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            await journalController.deleteJournalMember(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an Owner deleting a Reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()

                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            await journalController.deleteJournalMember(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an Owner deleting an Editor', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 2
                }
            }

            const response = new Response()
            await journalController.deleteJournalMember(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when the authenticated user is an Owner deleting an Owner', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) //journalDAO.selectJournals()
                
                // getSession 
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

                // Relations
                .mockReturnValueOnce({ rowCount: 6, rows: [ ...database.users[1], ...database.users[2], ...database.users[3] ]}) 

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    userId: 1
                }
            }

            const response = new Response()
            await journalController.deleteJournalMember(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })
})
