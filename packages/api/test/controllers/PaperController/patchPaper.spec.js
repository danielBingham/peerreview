const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

xdescribe('PaperController.postPaper()', function() {

    // ====================== Fixture Data ====================================

    const database = DatabaseFixtures.database
    const papers = PaperFixtures

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new Logger(),
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
        features: new FeatureFlags() 
    }

    // Disable logging.
    core.logger.level = -1

    beforeEach(function() {
        core.database.query.mockReset()
        core.logger.level = -1 
    })

    it('should construct update SQL and respond with 200 and the patched paper', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
            .mockReturnValueOnce({ rowCount: 1, rows: [] })
            .mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

        const request = {
            body: {
                id: 2,
                isDraft: false 
            },
            params: {
                id: 2
            },
            session: {
                user: {
                    id: 1
                }
            }
        }
        const response = new Response()

        const paperController = new PaperController(core)
        await paperController.patchPaper(request, response)

        const expectedSQL = 'UPDATE papers SET is_draft = $1, updated_date = now() WHERE id = $2'
        const expectedParams = [ false, 2 ]

        const databaseCall = core.database.query.mock.calls[3]
        expect(databaseCall[0]).toEqual(expectedSQL)
        expect(databaseCall[1]).toEqual(expectedParams)

        expect(response.status.mock.calls[0][0]).toEqual(200)
        expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[1])

    })

    it('should ignore the id in the body and use the id in request.params', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
            .mockReturnValueOnce({ rowCount: 1, rows: [] })
            .mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

        const request = {
            body: {
                id: 3,
                isDraft: false
            },
            params: {
                id: 2
            },
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        await paperController.patchPaper(request, response)

        const expectedSQL = 'UPDATE papers SET is_draft = $1, updated_date = now() WHERE id = $2'
        const expectedParams = [ false, 2 ]

        const databaseCall = core.database.query.mock.calls[3]
        expect(databaseCall[0]).toEqual(expectedSQL)
        expect(databaseCall[1]).toEqual(expectedParams)

        expect(response.status.mock.calls[0][0]).toEqual(200)
        expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[1])

    })

    it('should throw ControllerError(401) if no user is authenticated', async function() {
        core.database.query.mockReturnValue({ rowCount: 0, rows: [] })

        const request = {
            body: {
                id: 1,
                isDraft: false
            },
            params: {
                id: 1
            },
            session: {}
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(401)
            expect(error.type).toEqual(`not-authenticated`)
        }
        expect.hasAssertions()
    })

    it('should throw ControllerError(404) if the paper we are attempting to patch is not found', async function() {
        core.database.query.mockReturnValue({ rowCount: 0, rows: [] })

        const request = {
            body: {
                id: 1,
                isDraft: false
            },
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
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(404)
            expect(error.type).toEqual(`not-found`)
        }
        expect.hasAssertions()
    })

    it('should throw ControllerError(403) if the patching user is not an owner', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

        const request = {
            body: {
                id: 2,
                isDraft: false
            },
            params: {
                id: 2
            },
            session: {
                user: {
                    id: 3
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual(`not-authorized:not-owner`)
        }
        expect.hasAssertions()
    })

    it('should throw ControllerError(403) if paper being patched is not a draft', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[1].length, rows: database.papers[1] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

        const request = {
            body: {
                id: 1,
                isDraft: false
            },
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
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual(`not-authorized:published`)
        }
        expect.hasAssertions()
    })

    it('should throw DAOError if the update attempt failed', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const request = {
            body: {
                id: 2,
                isDraft: false
            },
            params: {
                id: 2
            },
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(DAOError)
            expect(error.type).toEqual(`update-failure`)
        }
        expect.hasAssertions()
    })

    it('should throw ControllerError(500) if the patched paper is not found after patching', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
            .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
            .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
            .mockReturnValueOnce({ rowCount: 1, rows: [] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const request = {
            body: {
                id: 2,
                isDraft: false
            },
            params: {
                id: 2
            },
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(500)
            expect(error.type).toEqual(`server-error`)
        }
        expect.hasAssertions()
    })

    it('should pass thrown errors on to the error handler', async function() {
        core.database.query.mockImplementation(function(sql, params) {
            throw new Error('This is a test error!')
        })

        const request = {
            body: submittedPapers[0],
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.patchPaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(Error)
        }
        expect.hasAssertions()

    })

})
