const { Paper, PaperAuthor, PaperVersion } = require('../models/Paper')
const files = require('./File')

const papers = {}

// We'll use these later to initialize objects when constructing the fixtures.
let paper = null
let paperAuthor = null
let paperVersion = null

/******************************************************************************
 * Fixture 1: Single Author, Single Version Paper
 ******************************************************************************/

// @see packages/backend/test/fixtures/database.js -> papers[0]
paper = new Paper()
paper.id = 1
paper.title = 'Single Author, Single Version Paper'
paper.isDraft = true 
paper.showPreprint = true
paper.score = 1
paper.createdDate = 'TIMESTAMP'
paper.updatedDate = 'TIMESTAMP'

// Author 1
// @see packages/backend/test/fixtures/database.js -> paper_authors[0]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 1
paperAuthor.order = 1
paperAuthor.owner = true
paperAuthor.submitter = true
paperAuthor.role = 'corresponding-author'
paper.authors.push(paperAuthor)

// Version 1
// @ see packages/backend/test/fixtures/database.js -> paper_versions[0]
paperVersion = new PaperVersion()
paperVersion.version = 1
paperVersion.file = files.dictionary[1]
paperVersion.content = 'This is the content of a single author, single version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'
paper.versions.push(paperVersion)

paper.fields.push(1)

papers[paper.id] = paper

/******************************************************************************
 * Fixture 2: Multiple author, single version paper
 ******************************************************************************/

paper = new Paper()
paper.id = 2
paper.title = 'Multiple Author, Single Version Paper'
paper.isDraft = true  
paper.showPreprint = false 
paper.score = 2
paper.createdDate = 'TIMESTAMP'
paper.updatedDate = 'TIMESTAMP'

// Author 1
// @see packages/backend/test/database.js -> paper_authors[1]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 2
paperAuthor.order = 1
paperAuthor.owner = true
paperAuthor.submitter = true
paperAuthor.role = 'corresponding-author'
paper.authors.push(paperAuthor)

// Author 2
// @see packages/backend/test/database.js -> paper_authors[2]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 3
paperAuthor.order = 2
paperAuthor.owner = false
paperAuthor.submitter = false
paperAuthor.role = 'author'
paper.authors.push(paperAuthor)

// Version 1
// @see packages/backend/test/database.js -> paper_versions[1]
paperVersion = new PaperVersion()
paperVersion.version = 1
paperVersion.file = files.dictionary[2]
paperVersion.content = 'This is the content of a multiple author, single version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'
paper.versions.push(paperVersion)

paper.fields.push(1)

papers[paper.id] = paper

/******************************************************************************
 * Fixture 3: Single author, Multiple version paper
 ******************************************************************************/

paper = new Paper()
paper.id = 3
paper.title = 'Single Author, Multiple Version Paper'
paper.isDraft = false 
paper.showPreprint = true 
paper.score = 3
paper.createdDate = 'TIMESTAMP'
paper.updatedDate = 'TIMESTAMP'

// Author 1
// @see packages/backend/test/database.js -> paper_authors[3]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 4
paperAuthor.order = 1
paperAuthor.owner = true
paperAuthor.submitter = true
paperAuthor.role = 'corresponding-author'
paper.authors.push(paperAuthor)

// Version 1
// @see packages/backend/test/database.js -> paper_versions[2]
paperVersion = new PaperVersion()
paperVersion.version = 1
paperVersion.file = files.dictionary[3]
paperVersion.content = 'This is the content of a single author, multiple version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'
paper.versions.push(paperVersion)

// Version 2
// @see packages/backend/test/database.js -> paper_versions[3]
paperVersion = new PaperVersion()
paperVersion.version = 2
paperVersion.file = files.dictionary[4]
paperVersion.content = 'This is the content of a second version of a single author, multiple version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'

paper.fields.push(1)

papers[paper.id] = paper

/******************************************************************************
 * Fixture 4: Multiple author, Multiple version paper
 ******************************************************************************/

paper = new Paper()
paper.id = 4
paper.title = 'Multiple Author, Multiple Version Paper'
paper.isDraft = false 
paper.showPreprint = false 
paper.score = 4
paper.createdDate = 'TIMESTAMP'
paper.updatedDate = 'TIMESTAMP'

// Author 1
// @see packages/backend/test/database.js -> paper_authors[4]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 5
paperAuthor.order = 1
paperAuthor.owner = true
paperAuthor.submitter = true
paperAuthor.role = 'corresponding-author'
paper.authors.push(paperAuthor)

// Author 2
// @see packages/backend/test/database.js -> paper_authors[5]
paperAuthor = new PaperAuthor()
paperAuthor.userId = 6
paperAuthor.order = 2
paperAuthor.owner = false 
paperAuthor.submitter = false 
paperAuthor.role = 'author'
paper.authors.push(paperAuthor)

// Version 1
// @see packages/backend/test/database.js -> paper_versions[4]
paperVersion = new PaperVersion()
paperVersion.version = 1
paperVersion.file = files.dictionary[5]
paperVersion.content = 'This is the content of a multiple author, multiple version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'
paper.versions.push(paperVersion)

// Version 2
// @see packages/backend/test/database.js -> paper_versions[5]
paperVersion = new PaperVersion()
paperVersion.version = 2
paperVersion.file = files.dictionary[6]
paperVersion.content = 'This is the content of a second version of a multiple author, multiple version paper.'
paperVersion.reviewCount = 0
paperVersion.createdDate = 'TIMESTAMP'
paperVersion.updatedDate = 'TIMESTAMP'

paper.fields.push(1)

papers[paper.id] = paper

module.exports = {
    dictionary: papers,
    list: Object.values(papers),
    meta: {
        count: Object.keys(papers).length,
        page: 1,
        pageSize: 20,
        numberOfPages: 1
    },
    relations: {}
}
