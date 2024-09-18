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
const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PaperVersionController {

    constructor(core) {
        this.core = core

        this.paperVersionDAO = new backend.PaperVersionDAO(core)

        this.submissionService = new backend.SubmissionService(core)
        this.paperService = new backend.PaperService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        return {}
    }

    async parseQuery(paperId, currentUser, query, options) {
        const parsedQuery = {
            where: 'WHERE paper_versions.paper_id = $1',
            params: [paperId],
            order: null,
            emptyResult: false,
            requestedRelations: query.requestedRelations
        }

        if ( ! currentUser ) {
            parsedQuery.where += ' AND ( paper_versions.is_preprint = true OR paper_versions.is_published = true )'
        } else if ( currentUser ) {
            const authorResults = await this.core.database.query(
                `SELECT user_id FROM paper_authors WHERE paper_id = $1 AND user_id = $2`, 
                [ paperId, currentUser.id ]
            )

            // If they are not an author, we need to check to see if they can view the submission.
            // If they can, then they can view public (preprint, published) and submitted versions.
            // If they can't, then they can only view public (preprint, published) versions.
            if ( authorResults.rows.length <= 0 ) {
                const canViewSubmission = await this.submissionService.canViewSubmission(currentUser, paperId)
                if ( canViewSubmission ) {
                    parsedQuery.where += ' AND ( paper_versions.is_preprint = true OR paper_versions.is_published = true OR paper_versions.is_submitted = true )'
                } else {
                    parsedQuery.where += ' AND ( paper_versions.is_preprint = true OR paper_versions.is_published = true OR paper_versions.is_submitted = true )'
                }
            } // else they are an author and can view
        }


        return parsedQuery
    }

    async getPaperVersions(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. IF No currentUser:
         * 1a. Can view published and preprint versions.
         * 2. IF currentUser and Author.
         * 2a. Can view all versions.
         * 3. IF currentUser and submission JournalMember with paper visibility.
         * 3a. Can view published, preprint, and submitted versions
         *
         **********************************************************************/

        const paperId = request.params.paperId

        const currentUser = request.session.user

        const { where, params, order, emptyResult } = await this.parseQuery(paperId, currentUser, request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 0,
                    numberOfPages: 1
                },
                dictionary: {},
                list: [],
                relations: {}
            })
        }

        const results = await this.paperVersionDAO.selectPaperVersions(where, params, order)
        results.meta = {
            count: results.list.length,
            page: 1,
            pageSize: 0,
            numberOfPages: 1
        }
        results.relations = await this.getRelations(currentUser, results, request.query.relations)

        return response.status(200).json(results)
    }

    /**
     * POST /papers/:paperId/versions
     *
     * Add a new version to an existing paper.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we
     * wish to add a version to.
     * @param {Object} request.body The paper_version we're adding to
     * Paper(:paper_id).
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postPaperVersions(request, response) {
        const paperId = request.params.paperId
        const version = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 5. File(version.file.id) must be a valid file.
         * 6. File(verison.file.id) must not be attached to any other paper.
         * 
         * **********************************************************/
        
        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const currentUser = request.session.user

        const existingResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])
        const existing = existingResults.dictionary[paperId]

        // 2. Paper(:paper_id) must exist.
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a new version of a paper that doesn't exist.`)
        }

        // 3. User must be an owning author on Paper(:paper_id)
        if ( ! existing.authors.find((a) => a.userId == currentUser.id && a.owner)) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner User(${currentUser.id}) attempting to delete paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! existing.isDraft ) {
            throw new ControllerError(403, 'not-authorized:not-draft',
                `User(${currentUser.id}) attempting to delete published Paper(${paperId}).`)
        }

        const fileResults = await this.database.query(`
            SELECT files.id, paper_versions.version
                FROM files
                    LEFT OUTER JOIN paper_versions on files.id = paper_versions.file_id
                WHERE files.id = $1
        `, [ version.file.id ])

        // 5. File(verison.file.id) must be a valid file.
        if ( fileResults.rows.length <= 0) {
            throw new ControllerError(400, 'file-not-found',
                `User(${currentUser.id}) attempted to create a new version for Paper(${paperId}) with invalid File(${version.file.id}).`)
        }

        // 6. File(version.file.id) must not be attached to any other paper.
        if ( fileResults.rows[0].version ) {
            throw new ControllerError(400, 'file-in-use',
                `User(${currentUser.id}) attempted to attach File(${version.file.id}) to a second paper.`)

        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      POST the new version.
         ********************************************************/

        const versionNumber = await this.paperDAO.insertVersion(existing, version)

        const results = await this.paperVersionDAO.selectPaperVersions(
            'WHERE paper_versions.paper_id = $1 AND paper_versions.version = $2', 
            [ paperId, versionNumber ]
        )
        const entity = results.dictionary[paperId][versionNumber]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Paper(${paperId}) not found after inserting a new version!`)
        }

        const event = {
            paperId: paperId,
            actorId: currentUser.id,
            version: versionNumber,
            type: 'paper:new-version'
        }
        await this.paperEventService.createEvent(currentUser, event)

        // ==== Notifications =============================================
        
        this.notificationService.sendNotifications(
            currentUser,
            'new-version',
            {
                paper: entity,
                version: versionNumber
            }
        )

        const relations = await this.getRelations(currentUser, results)

        response.status(201).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * GET /papers/:paperId/version/:version
     */
    async getPaperVersion(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. Must be able to view Paper(:paperId)
         * 2. PaperVersion(:version) must exist.
         * 3. Must be able to view PaperVersion(:version)
         * 3a. IF isPublished or isPreprint, public can view.
         * 3b. If isSubmitted, currentUser can view if can view submission.
         * 3c. If currentUser is an author, can view.
         *
         **********************************************************************/

        const paperId = request.param.paperId
        const versionNumber = request.param.version

        const currentUser = request.session.user

        // 1. Must be able to view Paper(:paperId)
        const canViewPaper = await this.paperService.canViewPaper(currentUser, paperId)
        if ( ! canViewPaper ) {
            throw new ControllerError(404, 'not-found'
                `Attempt to view private PaperVersion(${versionNumber}) of Paper(${paperId}).`)
        }

        const versionResult = await this.paperVersionDAO.selectPaperVersions(
            'WHERE paper_versions.paper_id = $1 AND paper_versions.version = $2',
            [ paperId, versionNumber ]
        )

        // 2. PaperVersion(:version) must exist.
        if ( versionResult.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Paper(${paperId}) and PaperVersion(${versionNumber}) was not found!`)
        }

        const version = versionResult.dictionary[versionNumber]

        // If there isn't a current user, then it must be published or a preprint for 
        // the user to view it.
        //
        // 3. Must be able to view PaperVersion(:version)
        // 3a. IF isPublished or isPreprint, public can view.
        if ( ! currentUser && ! ( version.isPublished || version.isPreprint )) {
            throw new ControllerError(404, 'not-found',
                `Attempt to access private PaperVersion(${versionNumber}) of Paper(${paperId}).`)
        }

        // If it's published or a preprint, then we can view.
        //
        // Otherwise, we need to check the currentUser's permissions.
        if ( currentUser && ! ( version.isPublished || version.isPreprint ) ) {

            //  3c. If currentUser is an author, can view.
            const authorResults = await this.core.database.query(
                `SELECT user_id FROM paper_authors WHERE paper_authors.paper_id = $1 AND paper_authors.user_id = $2`,
                [ paperId, currentUser.id ]
            )

            //  By this point, if they are an author, then we pass them through. Otherwise
            //  check to see if they can view the submission.
            if ( authorResults.rows.lenth <= 0 && version.isSubmitted ) {
                const canViewSubmission = await this.submissionService.canViewSubmission(currentUser, paperId)

                //  3b. If isSubmitted, currentUser can view if can view submission.
                if ( ! canViewSubmission ) {
                    throw new ControllerError(404, 'not-found',
                        `Attempt to access private PaperVersion(${versionNumber}) of Paper(${paperId}).`)
                }
            }

            // If it's not a submitted version and they aren't an author, then
            // they can't view at this point.
            else if ( authorResults.rows.length <= 0 ) {
                throw new ControllerError(404, 'not-found',
                    `Attempt to access private PaperVersion(${versionNumber}) of Paper(${paperId}).`)
            }
        }
           
        /********************************************************
         * Permissions Checks and Validation Complete
         *      GET the version.
         ********************************************************/

        const results = await this.paperVersionDAO.selectPaperVersions(
            `WHERE paper_versions.paperId = $1 AND paper_versions.version = $2`,
            [ paperId, versionNumber ]
        )

        if ( results.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Failed to find PaperVersion(${versionNumber}) of Paper(${paperId}).`)
        }

        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: results.dictionary[paperId][versionNumber],
            relations: relations
        })
    }

    /**
     * PATCH /papers/:paperId/version/:version
     *
     * Update an existing version on a paper.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper in question.
     * @param {int} request.params.version The version of that paper we want to patch.
     * @param {Object} request.body The partial paper_version object that will be used to update the paper_verison.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchPaperVersion(request, response) {
        let paper_version = request.body
        const paperId = request.params.paper_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Paper(:paper_id) must exist.
         * 3. User must be an owning author on Paper(:paper_id).
         * 4. Paper(:paper_id) must be a draft.
         * 5. PaperVersion(:version) must exist.
         * 
         * **********************************************************/
        
        // We want to use the params.id over any id in the body.
        //
        // @TODO check these for mismatch and throw an error instead of
        // overriding.
        paper_version.paperId = request.params.paper_id
        paper_version.version = request.params.version

        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to delete paper(${request.params.id}).`)
        }

        const user = request.session.user

        const papers = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])

        // 2. Paper(:paper_id) must exist.
        if ( papers.length <= 0) {
            throw new ControllerError(404, 'not-found',
                `User(${user.id}) attempted to patch a version of Paper(${paperId}), but it didn't exist!`)
        }

        const paper = papers[0]

        // 3. User must be an owning author on Paper(:paper_id)
        if ( ! paper.authors.find((a) => a.user.id == user.id && a.owner)) {
            throw new ControllerError(403, 'not-owner', 
                `Non-owner user(${user.id}) attempting to PATCH Paper(${request.params.id}).`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! paper.isDraft ) {
            throw new ControllerError(403, 'not-authorized:not-draft',
                `User(${user.id}) attempting to delete published Paper(${paperId}).`)
        }

        // 5. PaperVersion(:version) must exist.
        const paperVersions = await this.paperVersionDAO.selectPaperVersions('WHERE paper_versions.paper_id = $1', [ paperId ])
        if ( ! paper_version.version in paperVersions.list ) {
            throw new ControllerError(404, 'version-not-found',
                `User(${user.id}) attempted to patch Version(${paper_version.version}) on Paper(${paperId}), but it didn't exist!`)
        }


        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the version.
         ********************************************************/

        // TODO

        const returnPapers = await this.paperDAO.selectPapers('WHERE papers.id=$1', [paper_version.paperId])
        if ( ! returnPapers ) {
            throw new ControllerError(500, 'server-error', `Paper(${paper.id}) not found after inserting a new version!`)
        } 
        response.status(200).json(returnPapers[0])
    }

}
