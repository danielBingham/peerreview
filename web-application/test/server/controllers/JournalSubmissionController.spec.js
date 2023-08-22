const backend = require('@danielbingham/peerreview-backend')
const DAOError = backend.DAOError

const FeatureFlags = require('../../../server/features')

const JournalSubmissionController = require('../../../server/controllers/JournalSubmissionController')

const ControllerError = require('../../../server/errors/ControllerError')

const DatabaseFixtures = require('../fixtures/database')
const ExpectedFixtures = require('../fixtures/entities')

describe('JournalSubmissionController', function() {

    // ====================== Fixture Data ====================================

    const database = DatabaseFixtures.database
    const expectedSubmissions = ExpectedFixtures.journalSubmissions

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

    describe('.getSubmissions()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 and the requested journal submissions', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                .mockReturnValueOnce({ rowCount: 3, rows: [ ...database.journalSubmissions[1], ...database.journalSubmissions[2] ] })
                .mockReturnValueOnce({ rowCount: 1, rows: [ { count: 2 } ] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                query: {}
            }

            const response = new Response()
            await journalSubmissionController.getSubmissions(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedSubmissions)

        })

        it('should pass any errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }

            expect.hasAssertions()
        })
    })

    describe('.postSubmissions()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1
                },
                body: {
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalSubmissionController.postSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 404 for papers that do not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

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
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalSubmissionController.postSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-authors', async function() {
            const paper_rows = [
                { id: 1, user_id: 1, owner: true },
                { id: 1, user_id: 2, owner: false }
            ]


            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: paper_rows }) 

            const journalSubmissionController = new JournalSubmissionController(core)

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
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized:not-owner')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for authors who are not owners', async function() {
            const paper_rows = [
                { id: 1, user_id: 1, owner: true },
                { id: 1, user_id: 2, owner: false }
            ]


            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: paper_rows }) 

            const journalSubmissionController = new JournalSubmissionController(core)

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
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized:not-owner')
            }

            expect.hasAssertions()
        })

        it('should return a 400 for papers that have already been submitted', async function() {
            const paper_rows = [
                { id: 1, user_id: 1, owner: true },
                { id: 1, user_id: 2, owner: false }
            ]

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 2, rows: paper_rows }) 
                .mockReturnValueOnce({ rowCount: 1, rows: [ { paper_id: 1 } ] })

            const journalSubmissionController = new JournalSubmissionController(core)

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
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postSubmissions(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(400)
                expect(error.type).toBe('duplicate-submission')
            }

            expect.hasAssertions()
        })

        it('should return a 201 and the created submission', async function() {
            const paper_rows = [
                { id: 1, user_id: 1, owner: true },
                { id: 1, user_id: 2, owner: false }
            ]

            core.database.query.mockReturnValue(undefined)
                // Get paper information
                .mockReturnValueOnce({ rowCount: 2, rows: paper_rows }) 
                // Check for existing paper
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                // Insert submission
                .mockReturnValueOnce({ rowcount: 1, rows: [ { id: 1 } ] })
                // Get inserted submission
                .mockReturnValueOnce({ rowCount: 1, rows: database.journalSubmissions[1] })

            const journalSubmissionController = new JournalSubmissionController(core)

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
                    id: 1
                }
            }

            const response = new Response()
            await journalSubmissionController.postSubmissions(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(201)
            expect(response.json.mock.calls[0][0]).toEqual({
                entity: expectedSubmissions.dictionary[1],
                relations: expectedSubmissions.relations
            })
        })
    })

    describe('.getSubmission()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the related journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) // journalDAO.selectJournals(where id = journalId)

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return 403 for reviewers requesting a submission not in review', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                .mockReturnValueOnce({ rowCount: 1, rows: database.journalSubmissions[1] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested submission does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] })  // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) // journalSubmissionDAO.selectJournalSubmissions()

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.getSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return 200 and requested submission', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                .mockReturnValueOnce({ rowCount: 1, rows: database.journalSubmissions[1] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            await journalSubmissionController.getSubmission(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({ 
                entity: expectedSubmissions.dictionary[1],
                relations: expectedSubmissions.relations
            })
        })
    })

    describe('.putSubmission()', function() {
        it('should return 501 not implemented', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    id: 1
                },
                query: {}
            }

            const response = new Response()
            try {
                await journalSubmissionController.putSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(501)
                expect(error.type).toBe('not-implemented')
            }

            expect.hasAssertions()
        })
    })

    describe('.patchSubmission()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1
                },
                body: {
                    status: 'in-review'
                },
            }

            const response = new Response()
            try {
                await journalSubmissionController.patchSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                },
                body: {
                    status: 'in-review'
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.patchSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                },
                body: {
                    status: 'in-review'
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.patchSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return 403 for reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1]  }) // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // journalSubmissionDAO.updatePartialSubmission 


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                },
                body: {
                    status: 'in-review'
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.patchSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 and the patched submission', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1]  }) // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // journalSubmissionDAO.updatePartialSubmission 
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] }) // journalSubmissionDAO.selectJournalSubmissions 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                },
                body: {
                    status: 'in-review'
                },
            }

            const response = new Response()
            await journalSubmissionController.patchSubmission(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                entity: expectedSubmissions.dictionary[1],
                relations: expectedSubmissions.relations
            })
        })
    })

    describe('.deleteSubmission()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) // journalDAO.selectJournals

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
                
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('not-found')
            }

            expect.hasAssertions()
        })

        it('should return 403 for reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1]  }) // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // journalSubmissionDAO.deleteSubmission()


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteSubmission(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 when the journal was successfully deleted', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1]  }) // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: 1, rows: [] }) // journalSubmissionDAO.deleteSubmission()

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    id: 1
                }
            }

            const response = new Response()
            await journalSubmissionController.deleteSubmission(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

    describe('.postReviewers()', function() {
        it('should return a 400 when request body is missing', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    submissionId: 1
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(400)
                expect(error.type).toBe('missing-body')
            }

            expect.hasAssertions()
        })
        

        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 2
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 404 when the submission does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 2
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('submission-not-found')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmission
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // selectJournals
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 2
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('journal-not-found')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 2
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })


        it('should return 403 for reviewers attempting to assign someone other than themselves', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 2
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.postReviewers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 for reviewers assigning themselves', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.postReviewers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when owners assign reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.postReviewers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when editors assign reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1
                },
                body: {
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.postReviewers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

    describe('.deleteReviewer()', function() {
        it('should return a 401 for non-authenticated users', async function() {
            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {},
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }
                
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteReviewer(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(401)
                expect(error.type).toBe('not-authenticated')
            }

            expect.hasAssertions()
        })

        it('should return a 404 when the submission does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteReviewer(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('submission-not-found')
            }

            expect.hasAssertions()
        })

        it('should return 404 when the requested journal does not exist', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmission
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // selectJournals
                .mockReturnValueOnce({ rowCount: 0, rows: [] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteReviewer(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(404)
                expect(error.type).toBe('journal-not-found')
            }

            expect.hasAssertions()
        })

        it('should return a 403 for non-member users', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 

            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 4
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }

            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteReviewer(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })


        it('should return 403 for reviewers attempting to unassign someone other than themselves', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 2
                }
            }

            const response = new Response()
            try {
                await journalSubmissionController.deleteReviewer(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toBe(403)
                expect(error.type).toBe('not-authorized')
            }

            expect.hasAssertions()
        })

        it('should return 200 for reviewers unassigning themselves', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 3
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.deleteReviewer(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when owners unassign reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 1
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.deleteReviewer(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })

        it('should return 200 when editors unassign reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })
                // journalDAO.selectJournals
                .mockReturnValueOnce({ rowCount: database.journals[1].length, rows: database.journals[1] }) 
                // insertJournalSubmissionReviewer
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                // selectJournalSubmissions
                .mockReturnValueOnce({ rowCount: database.journalSubmissions[1].length, rows: database.journalSubmissions[1] })


            const journalSubmissionController = new JournalSubmissionController(core)

            const request = {
                session: {
                    user: {
                        id: 2
                    }
                },
                params: {
                    journalId: 1,
                    submissionId: 1,
                    userId: 3
                }
            }

            const response = new Response()
            await journalSubmissionController.deleteReviewer(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
        })
    })

})
