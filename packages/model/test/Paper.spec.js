const { Paper, PaperAuthor, PaperVersion } = require('../models/Paper')
const { File } = require('../models/File')

describe('Paper', function() {

    describe('toJSON()', function() {

        it(`should convert the model to JSON when it has no children`, function() { 
            const paper = new Paper()

            const expectedJSON = {
                id: null,
                title: '',
                isDraft: true,
                showPreprint: false,
                score: 0,
                createdDate: null,
                updatedDate: null,
                authors: [],
                fields: [],
                versions: []
            }

            expect(paper.toJSON()).toEqual(expectedJSON)
        })

        it(`should convert the model to JSON when it has children`, function() {
            const paper = new Paper()
            paper.id = 1
            paper.title = "Test Paper"
            paper.isDraft = false
            paper.showPreprint = true
            paper.score = 0
            paper.createdDate = 'TIMESTAMP'
            paper.updatedDate = 'TIMESTAMP'

            const paperAuthor = new PaperAuthor()
            paperAuthor.userId = 1
            paperAuthor.order = 1
            paperAuthor.owner = true
            paperAuthor.submitter = true

            paper.authors.push(paperAuthor)

            const paperVersion = new PaperVersion()

            paperVersion.version = 1
            paperVersion.content = 'This is a paper body.'
            paperVersion.reviewCount = 1
            paperVersion.createdDate = 'TIMESTAMP'
            paperVersion.updatedDate = 'TIMESTAMP'

            paperVersion.file = new File()
            paperVersion.file.id = 1
            paperVersion.file.userId = 1
            paperVersion.file.location = 'https://localhost/'
            paperVersion.file.filepath = 'images/test.png'
            paperVersion.file.type = 'image/png'
            paperVersion.file.createdDate = 'TIMESTAMP'
            paperVersion.file.updatedDate = 'TIMESTAMP'

            paper.versions.push(paperVersion)

            paper.fields.push(1)

            const expectedJSON = {
                id: 1,
                title: 'Test Paper',
                isDraft: false,
                showPreprint: true,
                score: 0,
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP',
                authors: [
                    {
                        userId: 1,
                        order: 1,
                        owner: true,
                        submitter: true
                    }
                ],
                versions: [
                    {
                        version: 1,
                        content: 'This is a paper body.',
                        reviewCount: 1,
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP',
                        file: {
                            id: 1,
                            userId: 1,
                            location: 'https://localhost/',
                            filepath: 'images/test.png',
                            type: 'image/png',
                            createdDate: 'TIMESTAMP',
                            updatedDate: 'TIMESTAMP'
                        }
                    }
                ],
                fields: [ 1 ]
            }

            expect(paper.toJSON()).toEqual(expectedJSON)
        })
    })
})
