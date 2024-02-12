const { File } = require('../models/File')

const files = {}

// We'll use these later to initialize objects when constructing the fixtures.
let file = null

/******************************************************************************
 * Fixture 1:  File for Single Author, Single Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[0]
file = new File()
file.id = 1
file.userId = 1
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/1-1-single-author-single-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

/******************************************************************************
 * Fixture 2:  File for Multiple Author, Single Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[1]
file = new File()
file.id = 2
file.userId = 2
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/2-1-multiple-author-single-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

/******************************************************************************
 * Fixture 3:  File for Single Author, Multiple Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[2]
file = new File()
file.id = 3
file.userId = 4
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/3-1-single-author-multiple-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

/******************************************************************************
 * Fixture 4:  File for Second Version of Single Author, Multiple Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[3]
file = new File()
file.id = 4
file.userId = 4
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/3-2-single-author-multiple-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

/******************************************************************************
 * Fixture 5:  File for Multiple Author, Multiple Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[4]
file = new File()
file.id = 5
file.userId = 5
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/4-1-multiple-author-multiple-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

/******************************************************************************
 * Fixture 6:  File for Second Version of Multiple Author, Multiple Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> files[5]
file = new File()
file.id = 6
file.userId = 5
file.location = 'https://s3.amazonaws.com/'
file.filepath = 'papers/4-2-multiple-author-multiple-version-paper.pdf'
file.type = 'application/pdf'
file.createdDate = 'TIMESTAMP'
file.updatedDate = 'TIMESTAMP'

files[file.id] = file

module.exports = {
    dictionary: files,
    list: Object.values(files),
    meta: {
        count: Object.keys(files).length,
        page: 1,
        pageSize: 20,
        numberOfPages: 1
    },
    relations: {}
}
