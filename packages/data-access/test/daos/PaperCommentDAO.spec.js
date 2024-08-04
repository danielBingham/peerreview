const Logger = require('../../logger')
const FeatureFlags = require('../../features')

const PaperCommentDAO = require('../../daos/PaperCommentDAO')

const DatabaseFixtures = require('../fixtures/database')
const EntityFixtures = require('../fixtures/entities')

describe('PaperCommentDAO', function() {

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

    describe('hydratePaperComments()', function() {

        it('should return a properly populated result set', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ 
                    rowCount: 3, 
                    rows: [ 
                        ...DatabaseFixtures.database.paperComments[1],
                        ...DatabaseFixtures.database.paperComments[2],
                        ...DatabaseFixtures.database.paperComments[3]
                    ]
                })

            const paperCommentDAO = new PaperCommentDAO(core)
            const results = await paperCommentDAO.selectPaperComments()

            const expectedResult = {
                dictionary: EntityFixtures.paperComments.dictionary,
                list: EntityFixtures.paperComments.list
            }

            expect(results).toEqual(expectedResult)
        })

    })
})
