const mime = require('mime')
const FileService = require('../services/files')
const FileDAO = require('../daos/files')
const { v4: uuidv4 } = require('uuid')

module.exports = class FileController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fileService = new FileService(this.logger)
        this.fileDAO = new FileDAO(this.database, this.logger)
    }

    async upload(request, response) {
        try {
            console.log(request.file)
            const currentPath = request.file.path

            const id = uuidv4()
            const type = request.file.mimetype 
            const filepath = '/uploads/files/'+id+mime.getExtension(type)

            this.fileService.moveFile(currentPath, filepath)

            const file = {
                id: id,
                type: type,
                filepath: filepath
            }

            await this.fileDAO.insertFile(file)

            const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
            if ( files.length <= 0) {
                throw new Error(`Failed to select newly inserted file ${id}.`)
            }
            return response.status(200).json(files[0])
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({ error: 'server-error'})
        }
    }


}
