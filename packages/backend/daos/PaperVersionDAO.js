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
const mime = require('mime')
const sanitizeFilename = require('sanitize-filename')
const fs = require('fs')
const pdfjslib = require('pdfjs-dist/legacy/build/pdf.js')

const FileDAO = require('./FileDAO')
const S3FileService = require('../services/S3FileService')

module.exports = class PaperVersionDAO {

    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)
        this.fileService = new S3FileService(core)
    }

    getPaperVersionsSelectionString() {
        return `
            paper_versions.id as "PaperVersion_id",
            paper_versions.paper_id as "PaperVersion_paperId",
            paper_versions.is_published as "PaperVersion_isPublished",
            paper_versions.is_preprint as "PaperVersion_isPreprint",
            paper_versions.is_submitted as "PaperVersion_isSubmitted",
            paper_versions.content as "PaperVersion_content",
            paper_versions.review_count as "PaperVersion_reviewCount",
            paper_versions.created_date as "PaperVersion_createdDate", 
            paper_versions.updated_date as "PaperVersion_updatedDate",
        `
    }

    hydratePaperVersions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const paperVersion = {
                id: row.PaperVersion_id,
                paperId: row.PaperVersion_paperId,
                file: this.fileDAO.hydrateFile(row),
                isPublished: row.PaperVersion_isPublished,
                isPreprint: row.PaperVersion_isPreprint,
                isSubmitted: row.PaperVersion_isSubmitted,
                content: row.PaperVersion_content,
                reviewCount: row.PaperVersion_reviewCount,
                createdDate: row.PaperVersion_createdDate,
                updatedDate: row.PaperVersion_updatedDate
            }
            dictionary[paperVersion.id] = paperVersion
            list.push(paperVersion.id)
        }

        return { dictionary: dictionary, list: list }
    }

    async selectPaperVersions(where, params, order) {
        where = (where ? where : '')
        params = (params ? params : [])
        order = ( order ? order : 'paper_versions.created_date desc')

        const sql = `
            SELECT
                ${ this.getPaperVersionsSelectionString() }
                ${ this.fileDAO.getFilesSelectionString() }
            FROM paper_versions
                LEFT OUTER JOIN files ON paper_versions.file_id = files.id
            ${where}
            ORDER BY ${order} 
        `
        const results = await this.core.database.query(sql, params)

        if ( results.rows.length == 0 ) {
            return { dictionary: {}, list: [] }
        } else {
            return this.hydratePaperVersions(results.rows)
        }
    }

    async insertPaperVersion(paper, paperVersion) {
        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ paperVersion.file.id ])
        if ( files.length <= 0) {
            throw new DAOError('invalid-file', `Invalid file_id posted with PaperVersion(${paperVersion.id}) of Paper(${paperVersion.paperId}).`)
        }
        const file = files[0]

        const url = new URL(file.filepath, file.location)
        const pdf = await pdfjslib.getDocument(url.toString()).promise
        let content = ''
        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber)
            const textContent = await page.getTextContent()

            for(const item of textContent.items ) {
                content += item.str 
            }
        }

        content = content.replace(/\0/g, '')

        if ( content.trim().length == 0 ) {
            console.log('Empty PDF!')
        }

        const versionResults = await this.core.database.query(`
            INSERT INTO paper_versions (paper_id, file_id, content, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
            RETURNING id
        `, [ paper.id, file.id, content ])

        if ( versionResults.rowCount <= 0) {
            throw new DAOError('failed-insertion', `Failed to insert version for paper ${paper.id} and file ${file.id}.`)
        }

        const id = versionResults.rows[0].id

        const title = paper.title
        let titleFilename = title.replaceAll(/\s/g, '-')
        titleFilename = titleFilename.toLowerCase()
        titleFilename = sanitizeFilename(titleFilename)

        const filename = `${paper.id}-${id}-${titleFilename}.${mime.getExtension(file.type)}`
        const filepath = 'papers/' + filename

        const newFile = { ...file }
        newFile.filepath = filepath

        // TODO Should moving the file when the file is updated be the
        // responsibility of the FileDAO?  Probably.
        await this.fileService.copyFile(file.filepath, filepath)
        await this.fileDAO.updateFile(newFile)
        await this.fileService.removeFile(file.filepath)

        return id 
    }

    async updatePaperVersion(paperVersion) {
        const allowedFields = [ 'isPublished', 'isPreprint', 'isSubmitted' ]

        let sql = 'UPDATE paper_versions SET '
        let params = []
        let count = 1
        for(let key in paperVersion) {
            if ( ! allowedFields.includes(key)) {
                continue
            }

            if ( key == 'isPublished' ) {
                sql += `is_published = $${count}, `
            } else if ( key == 'isPreprint' ) {
                sql += `is_preprint = $${count}, `
            } else if ( key == 'isSubmitted' ) {
                sql += `is_submitted = $${count}, `
            }

            params.push(paperVersion[key])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id=$${count}`
        params.push(paperVersion.id)

        const results = await this.core.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update PaperVersion(${paperVersion.id} of Paper(${paperVersion.paperId}).`)
        }
    }
}
