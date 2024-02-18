const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

xdescribe('PaperController.getPaper()', function() {

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

    it('should return 200 and the requested paper', async function() {
        core.database.query.mockReturnValueOnce({rowCount:8, rows: database.papers[1]})
            .mockReturnValueOnce({rowCount: 2, rows: database.users[1]})
            .mockReturnValueOnce({rowCount: 2, rows: database.users[2]})

        const request = {
            params: {
                id: 1
            },
            session: { }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        await paperController.getPaper(request, response)

        expect(response.status.mock.calls[0][0]).toEqual(200)
        expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[0])
    })

    it('should throw a ControllerError with 404 when the paper does not exist', async function() {
        core.database.query.mockReturnValue({rowCount:0, rows: []})
        const request = {
            params: {
                id: 3
            },
            session: {}
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.getPaper(request, response)
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
        const paperController = new PaperController(core)
        try {
            await paperController.getPaper(request, response)
        } catch(error) {
            expect(error).toBeInstanceOf(Error)
        }

        expect.hasAssertions()
    })

})
