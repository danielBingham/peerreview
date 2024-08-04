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
import { Pool, Client } from 'pg'
import mime from 'mime'
import sanitizeFilename from 'sanitize-filename'

import { Core } from '@JournalHub/core' 
import { DataAccess } from '@JournalHub/data-access'
import { Paper, PaperVersion } from '@JournalHub/model'

import { S3FileService } from './files/S3FileService'

export class PaperVersionService {
    core: Core
    database: Pool | Client

    dao: DataAccess

    fileService: S3FileService

    constructor(core: Core, dao: DataAccess, database?: Pool | Client) {
        this.core = core
        this.dao = dao

        if ( database ) {
            this.database = database
        } else {
            this.database = core.database
        }
        
        this.fileService = new S3FileService(core, dao)
    }

    async savePaperVersionFile(paper: Paper, version: PaperVersion): Promise<void> {
        const title = paper.title
        let titleFilename = title.replace(/\s/g, '-')
        titleFilename = titleFilename.toLowerCase()
        titleFilename = sanitizeFilename(titleFilename)

        const filename = `${paper.id}-${version.version}-${titleFilename}.${mime.getExtension(version.file.type)}`
        const filepath = 'papers/' + filename

        const newFile = { ...version.file }
        newFile.filepath = filepath

        await this.fileService.copyFile(version.file.filepath, filepath)
        await this.dao.file.updateFile(newFile)
        await this.fileService.removeFile(version.file.filepath)
    }
}
