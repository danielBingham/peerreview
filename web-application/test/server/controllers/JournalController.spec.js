const backend = require('@danielbingham/peerreview-backend')
const DAOError = backend.DAOError

const FeatureFlags = require('../../../server/features')

const JournalController = require('../../../server/controllers/JournalController')

const ControllerError = require('../../../server/errors/ControllerError')

const DatabaseFixtures = require('../fixtures/database')
const ExpectedFixtures = require('../fixtures/expected')
const SubmittedFixtures = require('../fixtures/submitted')

describe('JournalController', function() {

    // ====================== Fixture Data ====================================

    const database = DatabaseFixtures.database
    const expectedJournals = ExpectedFixtures.journals

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
        features: new FeatureFlags() 
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
                .mockReturnValueOnce({ rowCount: 2, rows: [ ...database.journals[1], ...database.journals[2] ]}) 


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
                    editors: [
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

            const journalController = new JournalController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                body: {
                    name: 'Journal One',
                    description: 'A test journal',
                    editors: [
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
            expect(response.json.mock.calls[0][0]).toEqual(expectedJournals[0])


        })
    })

    describe('.getJournal', function() {
        
        it('should return 200 and the requested journal', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) 

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
            expect(response.json.mock.calls[0][0]).toEqual(expectedJournals[0])

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

        it('should return 403 when the logged in user is not a journal owner', async function() {
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

        it('should return 200 and the patched journal', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1]  }) // Get existing journal
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // UPDATE journals ...
                .mockReturnValueOnce({ rowCount: 1, rows: database.journals[1] }) // returnJournal = journalDAO.selectJournals()

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

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedJournals[0])

        })

    })

    describe('.deleteJournal()', function() {
        
        it('should throw 401 not-authenticated if no user is logged in.', async function() {
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

        it('should throw 403 not-authorized if the user logged in is not an owner of the journal', async function() {
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


})
