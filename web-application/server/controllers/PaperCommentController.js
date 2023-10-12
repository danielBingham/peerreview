
const { PaperCommentDAO } = require('@danielbingham/peerreview-backend')

module.exports = class PaperCommentsController {

    constructor(core) {
        this.core = core
    }


    async postPaperComments(request, response) {
        const paperId = request.params.paperId
        const paperComment = request.body

        


    }

    async patchPaperComment(request, response) {

    }

    async deletePaperComment(request, response) {

    }
}
