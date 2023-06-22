const fs = require('fs')

const { S3 } = require('@aws-sdk/client-s3')
const { PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')


module.exports = class S3FileService {

    constructor(core) {
        this.config = core.config

        const s3Config = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: core.config.s3.access_id,
                secretAccessKey: core.config.s3.access_key
            }
        }

        this.s3Client = new S3(s3Config)
    }

    async uploadFile(sourcePath, targetPath) {
        const filestream = fs.createReadStream(sourcePath)

        const params = {
            Bucket: this.config.s3.bucket,
            Key: targetPath,
            Body: filestream,
            ACL: 'public-read'
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    async copyFile(currentPath, newPath) {
        const params = {
            Bucket: this.config.s3.bucket,
            CopySource:this. config.s3.bucket + '/' + currentPath,
            Key: newPath,
            ACL: 'public-read'

        }

        await this.s3Client.send(new CopyObjectCommand(params))
    }

    async moveFile(currentPath, newPath) {
        await this.copyFile(currentPath, newPath)
        await this.removeFile(currentPath)
    }

    async removeFile(path) {
        const params = {
            Bucket: this.config.s3.bucket,
            Key: path
        }

        await this.s3Client.send(new DeleteObjectCommand(params))
    }

    removeLocalFile(path) {
        fs.rmSync(path)
    }
}
