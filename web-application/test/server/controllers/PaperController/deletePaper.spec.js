const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

xdescribe('PaperController.deletePaper()', function() {

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

    it('return `200` and the id of the deleted paper on success', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: 1, rows: [{ user_id: 1, owner: true }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [] })

        const request = {
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
        await paperController.deletePaper(request, response)

        expect(response.status.mock.calls[0][0]).toEqual(200)
        expect(response.json.mock.calls[0][0]).toEqual({paperId: 1})
    })

    it('should throw ControllerError(403) if no user is authenticated', async function() {
        const request = {
            params: {
                id: 1
            },
            session: {
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.deletePaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual('not-authorized')
        }
        expect.hasAssertions()
    })

    it('should throw ControllerError(403) if authenticated user is not owner', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: 0, rows: []  })

        const request = {
            params: {
                id: 1
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
            await paperController.deletePaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual('not-owner')
        }
        expect.hasAssertions()
    })

    it('should throw DAOError if delete returns no modified rows', async function() {
        core.database.query.mockReturnValueOnce({ rowCount: 1, rows: [{ user_id: 1, owner: true }] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const request = {
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
            await paperController.deletePaper(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(DAOError)
            expect(error.type).toEqual('deletion-failed')
        }
        expect.hasAssertions()
    })
})
