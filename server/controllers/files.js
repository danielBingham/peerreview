const mime = require('mime')
const { v4: uuidv4 } = require('uuid')

const FileService = require('../services/files')
const FileDAO = require('../daos/files')
const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')

module.exports = class FileController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fileService = new FileService(this.logger)
        this.fileDAO = new FileDAO(this.database, this.logger)
    }

    async upload(request, response) {
        try {
            if ( ! request.session || ! request.session.user ) {
                throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
            }

            const currentPath = request.file.path

            const id = uuidv4()
            const type = request.file.mimetype 
            const filepath = `/uploads/files/${id}.${mime.getExtension(type)}`

            this.fileService.moveFile(currentPath, filepath)

            const file = {
                id: id,
                userId: request.session.user.id,
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
            if ( error instanceof ControllerError) {
                return response.status(error.status).json({ error: error.type })
            } else if ( error instanceof DAOError ) {
                return response.status(500).json({ error: 'server-error' })
            } else {
                return response.status(500).json({ error: 'server-error'})
            }
        }
    }

    async deleteFile(request, response) {
        try {
            if ( ! request.session || ! request.session.user ) {
                throw new ControllerError(403, 'not-authorized', `Must have a logged in user to delete a file.`)
            }

            const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ request.params.id ])
            if ( files.length <= 0 ) {
                throw new ControllerError(404, 'not-found', `File ${request.params.id} not found!`)
            } else if ( files[0].userId !== request.session.user.id ) {
                // TODO Admin and moderator permissions.
                throw new ControllerError(403, 'not-authorized', `User(${request.session.user.id}) attempting to delete file(${files[0].id}, which they don't own.`)
            }

            const fileId = request.params.id
            await this.fileDAO.deleteFile(fileId)
            return response.status(200).json({ fileId: fileId })
        } catch(error) {
            this.logger.error(error)
            if ( error instanceof ControllerError ) {
                return response.status(error.status).json({ error: error.type })
            } else if ( error instanceof DAOError ) {
                if ( error.type == 'not-found' ) {
                    return response.status(404).json({ error: 'not-found' })
                } else {
                    return response.status(500).json({ error: 'server-error' })
                }
            } else {
                return response.status(500).json({ error: 'server-error' })
            }
        }
    }
}
