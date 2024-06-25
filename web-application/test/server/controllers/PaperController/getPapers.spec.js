const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

xdescribe('PaperController.getPapers()', function() {

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


    it('should return 200 and the papers', async function() {
        core.database.query.mockReturnValue([]).mockReturnValueOnce({ rowCount: 8, rows: database.papers[1]}) 
            .mockReturnValueOnce({ rowCount: 2, rows: database.users[1]})
            .mockReturnValueOnce({ rowCount: 2, rows: database.users[2]})


        const paperController = new PaperController(core)

        const request = {
            session: {},
            query: {}
        }

        const response = new Response()
        await paperController.getPapers(request, response)

        expect(response.status.mock.calls[0][0]).toEqual(200)
        expect(response.json.mock.calls[0][0]).toEqual([ expectedPapers.database[1] ])

    })

    xit('should handle an authorId query', async function() {})
    xit('should handle a fields query', async function() {})
    xit('should handle an excluseFields query', async function() {})
    xit('should handle a searchString query', async function() {})
    xit('should only return the papers a user has permission to see', async function() {})

    it('should pass any errors on to the error handler', async function() {
        core.database.query.mockImplementation(function(sql, params) {
            throw new Error('This is a test error!')
        })

        const paperController = new PaperController(core)

        const request = {
            session: {},
            query: {}
        }

        const response = new Response()
        try {
            await paperController.getPapers(request, response)
        } catch (error) {
            expect(error).toBeInstanceOf(Error)
        }

        expect.hasAssertions()
    })

})
