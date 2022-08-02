const fs = require('fs')

const config = require('../config')

const { S3 } = require('@aws-sdk/client-s3')
const { PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')


module.exports = class S3FileService {

    constructor() {
        const s3SpacesConfig = {
            endpoint: config.spaces.endpoint,
            region: 'us-east-1',
            credentials: {
                accessKeyId: config.spaces.access_id,
                secretAccessKey: config.spaces.access_key
            }
        }

        this.s3Client = new S3(s3SpacesConfig)
    }

    async uploadFile(sourcePath, targetPath) {
        const filestream = fs.createReadStream(sourcePath)

        const params = {
            Bucket: config.spaces.bucket,
            Key: targetPath,
            Body: filestream,
            ACL: 'public-read'
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    async copyFile(currentPath, newPath) {
        const params = {
            Bucket: config.spaces.bucket,
            CopySource: config.spaces.bucket + '/' + currentPath,
            Key: newPath,
            ACL: 'public-read'

        }
        console.log(`copyFile(${currentPath}, ${newPath})`)
        console.log(params)

        await this.s3Client.send(new CopyObjectCommand(params))
    }

    async moveFile(currentPath, newPath) {
        await this.copyFile(currentPath, newPath)
        await this.removeFile(currentPath)
    }

    async removeFile(path) {
        const params = {
            Bucket: config.spaces.bucket,
            Key: path
        }
        console.log(`removeFile(${path})`)
        console.log(params)

        await this.s3Client.send(new DeleteObjectCommand(params))
    }

    removeLocalFile(path) {
        fs.rmSync(path)
    }
}
