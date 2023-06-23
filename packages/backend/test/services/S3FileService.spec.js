
const S3FileService = require('../../services/S3FileService')

describe('S3FileService', function() {

    it('should initialize successfully', function() {
        const core = {
            config: {
                s3: {
                    access_id: "aaaaaa",
                    access_key: "aaaaaa"
                }
            }
        }
        const fileService = new S3FileService(core)
    })
})
