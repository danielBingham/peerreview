const mime = require('mime')
const { v4: uuidv4 } = require('uuid')

const config = require('../config')

const S3FileService = require('../services/S3FileService')
const FileDAO = require('../daos/files')
const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')

module.exports = class FileController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fileService = new S3FileService()
        this.fileDAO = new FileDAO(this.database, this.logger)
    }

    async upload(request, response) {
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        const currentPath = request.file.path

        const id = uuidv4()
        const type = request.file.mimetype 
        const filepath = `files/${id}.${mime.getExtension(type)}`

        await this.fileService.uploadFile(currentPath, filepath)

        const file = {
            id: id,
            userId: request.session.user.id,
            type: type,
            location: config.spaces.bucket_url,
            filepath: filepath
        }

        await this.fileDAO.insertFile(file)

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${id}.`)
        }

        this.fileService.removeLocalFile(currentPath)
        return response.status(200).json(files[0])
    }

    async deleteFile(request, response) {
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

        await this.fileService.removeFile(files[0].filepath)

        const fileId = request.params.id
        await this.fileDAO.deleteFile(fileId)
        return response.status(200).json({ fileId: fileId })
    }
}
