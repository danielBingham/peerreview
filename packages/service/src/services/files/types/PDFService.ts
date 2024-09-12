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
import { Core } from '@journalhub/core' 
import { FileDAO } from '@journalhub/data-access'

import mime from 'mime'
import sanitizeFilename from 'sanitize-filename'
import pdfjslib from 'pdfjs-dist/legacy/build/pdf.js'

import { ServiceError } from '../../../errors/ServiceError'

export class PDFService {
    core: Core

    fileDAO: FileDAO

    constructor(core: Core) {
        this.core = core

        this.fileDAO = new FileDAO(core)
    }

    async getPDFContent(fileId: number): Promise<string> {
        const files = await this.fileDAO.selectFiles({ 
            where: 'files.id = $1', 
            params: [ fileId ] 
        })

        if ( files.list.length <= 0) {
            throw new ServiceError('invalid-file', 
                `Attempt to get content for invalid File(${fileId})`)
        }

        const file = files.dictionary[fileId]

        const url = new URL(file.filepath, file.location)
        const pdf = await pdfjslib.getDocument(url.toString()).promise
        let content = ''
        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber)
            const textContent = await page.getTextContent()

            for(const item of textContent.items ) {
                if ( 'str' in item) {
                    content += item.str 
                }
            }
        }

        content = content.replace(/\0/g, '')

        if ( content.trim().length == 0 ) {
            console.log('Empty PDF!')
        }

        return content
    }
}
