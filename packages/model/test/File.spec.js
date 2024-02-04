const { File } = require('../models/File')

describe('File', function() {

    describe('toJSON()', function() {

        it('should convert a default file to JSON correctly', function() {

            const file = new File()

            const expectedJSON = {
                id: null,
                userId: null,
                location: '',
                filepath: '',
                type: '',
                createdDate: null,
                updatedDate: null
            }

            expect(file.toJSON()).toEqual(expectedJSON)
        })

        it('should convert a populated file to JSON correctly', function() {

            const file = new File()
            file.id = 1
            file.userId = 1
            file.location = 'https://localhost/'
            file.filepath = 'images/test.png'
            file.type = 'image/png'
            file.createdDate = 'TIMESTAMP'
            file.updatedDate = 'TIMESTAMP'

            const expectedJSON = {
                id: 1,
                userId: 1,
                location: 'https://localhost/',
                filepath: 'images/test.png',
                type: 'image/png',
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP' 
            }

            expect(file.toJSON()).toEqual(expectedJSON)
        })
    })

})
