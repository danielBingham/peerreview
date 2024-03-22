import { jest, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import { Pool } from 'pg'

import Core from '../../src/core'

import PaperCommentDAO from '../../src/daos/PaperCommentDAO'

import DatabaseFixtures from '../fixtures/database'
import { PaperFixtures } from '@danielbingham/peerreview-model' 

jest.mock('pg')

describe('PaperCommentDAO', function() {

    let core = new Core('@danielbingham/peerreview-backend:tests', {
        s3: {
            bucket_url: '',
            access_id: '',
            access_key: '',
            bucket: ''
        },
    })

    beforeAll(function() {

    })


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
