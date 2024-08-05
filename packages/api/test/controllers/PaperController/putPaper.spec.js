const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

xdescribe('PaperController.putPaper()', function() {

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

    it('should return 501 `not-implemented`', async function() {
        const request = {
            params: {
                id: 1
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        try {
            await paperController.putPaper(request, response)
        } catch(error) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(501)
            expect(error.type).toEqual('not-implemented')
        }

        expect.hasAssertions()

    })


})
