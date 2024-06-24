/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import fs from 'fs'

import { S3 } from '@aws-sdk/client-s3'
import { PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'

import { Core, ServiceError } from '@danielbingham/peerreview-core' 


export class S3FileService {
    core: Core
    s3Client: S3

    constructor(core: Core) {
        this.core = core


        const s3Config = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: core.config.s3.access_id,
                secretAccessKey: core.config.s3.access_key
            }
        }

        this.s3Client = new S3(s3Config)
    }

    async uploadFile(sourcePath: string, targetPath: string): Promise<void> {
        const filestream = fs.createReadStream(sourcePath)

        const params = {
            Bucket: this.core.config.s3.bucket,
            Key: targetPath,
            Body: filestream,
            ACL: 'public-read'
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    async copyFile(currentPath: string, newPath: string): Promise<void> {
        const params = {
            Bucket: this.core.config.s3.bucket,
            CopySource: this.core.config.s3.bucket + '/' + currentPath,
            Key: newPath,
            ACL: 'public-read'

        }

        await this.s3Client.send(new CopyObjectCommand(params))
    }

    async moveFile(currentPath: string, newPath: string): Promise<void> {
        await this.copyFile(currentPath, newPath)
        await this.removeFile(currentPath)
    }

    async removeFile(path: string): Promise<void> {
        const params = {
            Bucket: this.core.config.s3.bucket,
            Key: path
        }

        await this.s3Client.send(new DeleteObjectCommand(params))
    }

    removeLocalFile(path: string): void {
        fs.rmSync(path)
    }
}
