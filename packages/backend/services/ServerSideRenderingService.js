const path = require('path')
const fs = require('fs')

const Handlebars = require('handlebars')

/**
 * A service to handle logic related to Server Side Rendering.  For now, it's
 * just handling rendering the metadata into the page <head> tag.  That include
 * social sharing metadata as well as standard SEO metadata.
 */
module.exports = class ServerSideRenderingService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.indexTemplatePath = null
        if ( this.config.environment == 'development' ) {
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
    renderIndexTemplate(metadata) {
        const filepath = path.join(process.cwd(), this.indexTemplatePath)
        const rawTemplate = fs.readFileSync(filepath, 'utf8')
        const template = Handlebars.compile(rawTemplate)
        const parsedTemplate = template(metadata)
        return parsedTemplate
    }
}
