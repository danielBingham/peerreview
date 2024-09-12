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
import path from 'path'
import fs from 'fs'

import * as Handlebars from 'handlebars'
import { Client, Pool } from 'pg'

import { Core } from '@journalhub/core' 

import { PageMetadata } from './PageMetadataService'

/**
 * A service to handle logic related to Server Side Rendering.  For now, it's
 * just handling rendering the metadata into the page <head> tag.  That include
 * social sharing metadata as well as standard SEO metadata.
 */
export class ServerSideRenderingService {
    core: Core
    database: Client | Pool

    indexTemplatePath: string

    constructor(core: Core) {
        this.core = core
        this.database = core.database

        this.indexTemplatePath = '' 
        if ( this.core.config.environment == 'development' ) {
            this.indexTemplatePath = 'server/views/index.html'
        } else {
            this.indexTemplatePath = 'public/dist/index.html'
        }
    }

    /**
     * Render the index.html template appropriate to the environment using the
     * given metadata object.
     *
     * @param {Object} metadata The metadata to use to render the template.
     *
     * @return {string} The parsed template string.
     */
    renderIndexTemplate(metadata: PageMetadata): string  {
        const filepath = path.join(process.cwd(), this.indexTemplatePath)
        const rawTemplate = fs.readFileSync(filepath, 'utf8')
        const template = Handlebars.compile(rawTemplate)
        const parsedTemplate = template(metadata)
        return parsedTemplate
    }
}
