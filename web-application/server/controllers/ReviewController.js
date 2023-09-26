const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

/**
 *
 */
module.exports = class ReviewController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger

        this.reviewDAO = new backend.ReviewDAO(core)
        this.userDAO = new backend.UserDAO(core)
        this.paperDAO = new backend.PaperDAO(core)
        this.paperEventDAO = new backend.PaperEventDAO(core)

        this.paperEventService = new backend.PaperEventService(core)
        this.notificationService = new backend.NotificationService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}

        // ======== Default Relations =========================================
        // These are relations we always retrieve and return.

        // ======== Events ====================================================

        const eventResults = await this.paperEventDAO.selectEvents(
            'WHERE paper_events.review_id = ANY($1::bigint[])', [ results.list ]) 
        relations.events = eventResults.dictionary

        // ======== users =====================================================
        const userIds = []
        for(const [id, review] of Object.entries(results.dictionary)) {
            userIds.push(review.userId)
            for(const thread of review.threads) {
                for(const comment of thread.comments) {
                    if ( comment.status != 'in-progress' && comment.userId != currentUser?.id) {
                        userIds.push(comment.userId)
                    }
                }
            }
        }

        const userResults = await this.userDAO.selectCleanUsers(`WHERE users.id = ANY($1::bigint[])`, [ userIds ])
        relations.users = userResults.dictionary

        return relations

    }

    /**
     * GET /paper/:paper_id/reviews
     *
     * Return a JSON array of all reviews in the database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we
     * want to retrieve reviews for.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getReviews(request, response) {
        const paperId = request.params.paper_id

        const userId = request.session.user?.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permission checking on this endpoint is pretty simple:
         *
         * 1. Paper(:paper_id) exists.
         * 2. Visibility is controlled on the PaperEvent.
         * 2a. Except for the users reviews in progress.
         * 
         * **********************************************************/

        const paperResults = await this.database.query(
            'SELECT is_draft as "isDraft", show_preprint as "showPreprint" FROM papers WHERE papers.id = $1',
            [ paperId ]
        )

        // 1. Paper(:paper_id) exists.
        if ( paperResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Paper(${paperId}) to return reviews for.`)
        }

        const isDraft = paperResults.rows[0].isDraft
        const showPreprint = paperResults.rows[0].showPreprint

        // 2. Visibility is controlled on the event.
        const visibleIds = await this.paperEventService.getVisibleEventIds(userId, paperId)
        const eventResults = await this.database.query(`
            SELECT review_id FROM paper_events WHERE id = ANY($1::bigint[])
        `, [ visibleIds ])

        const reviewIds = eventResults.rows.map((r) => r.review_id)


       
        /********************************************************
         * Permission Checks Complete
         *       Get the Reviews
         ********************************************************/

        let where = ''
        let params = []
        
        if ( userId ) {
            where = `WHERE reviews.id = ANY($1::bigint[]) OR reviews.user_id = $2`
            params = [ reviewIds, userId ]
        } else {
            where = `WHERE reviews.id = ANY($1::bigint[])`
            params = [ reviewIds ]
        }

        const results = await this.reviewDAO.selectReviews(where, params)
        results.meta = await this.reviewDAO.countReviews(where, params)

        results.relations = await this.getRelations(request.session.user, results)

        // Doesn't need an await, since this just works with the comments in
        // memory and doesn't hit the database.
        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        return response.status(200).json(results)
    }

    /**
     * POST /paper/:paper_id/reviews
     *
     * Create a new review in the database from the provided JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we're
     * adding a review to.
     * @param {Object} request.body A `review` object to add to
     * Paper(:paper_id)
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postReviews(request, response) {
        const paperId = request.params.paper_id

        const review = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint, User must:
         *
         * 1. Be logged in.
         * 2. Have Review permissions on Paper(:paper_id)
         *
         * We also need to do basic input validation:
         *
         * 3. Paper(:paper_id) exists.
         *
         * And we need to ensure that Paper is in a state where it can be
         * reviewed:
         *
         * 4. Paper(:paper_id) must be a draft.
         *
         * Finally, we need to validate the POST body:
         *
         * 5. review.version must be a valid version of the paper.
         * 6. If review.number is provided, it must be the next increment for
         *      Paper(:paper_id) and version.
         * 7. review.status may only be 'in-progress' or 'submitted'.
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to POST review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        const paperResults = await this.paperDAO.selectPapers(`WHERE papers.id = $1`, [ paperId ])
        const paper = paperResults.dictionary[paperId]
        
        // 3. Paper(:paper_id) exists and has at least one version.
        if ( ! paper ) {
            throw new ControllerError(404, 'no-resource', `No Paper(${review.paperId}) to return reviews for.`)
        }

        // 4. Paper(:paper_id) must be a draft.
        if ( ! paper.isDraft ) {
            throw new ControllerError(403, 'not-authorized:published-paper', 
                `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        /********************************************************
         * Permissions Checks Complete
         *      Begin Input Validation 
         ********************************************************/

        // 5. If review.version is provided, it must be the most recent version for
        //      Paper(:paper_id).
       
        const currentVersion = paper.versions[0].version
        if ( review.version && (review.version < 0 || review.version > currentVersion) ) {
            throw new ControllerError(400, 'invalid-version',
                `User(${userId}) attempting to create review for invalid Version(${review.version}) of Paper(${paperId}).`)
        } else if ( ! review.version ) {
             review.version = currentVersion
        }

        // 6. If review.number is provided, it must be the next increment for
        //      Paper(:paper_id) and version.
        // TODO - WE're not currently using `number.  We're just using the id
        // of the review.


        // 7. review.status may only be 'in-progress' or 'submitted'.
        if ( review.status == 'accepted' || review.status == 'rejected' ) {
            throw new ControllerError(403, 'not-authorized:status',
                `User(${userId}) attempting to accept or reject their own review on creation.`)
        }

        /********************************************************
         * Input Validation Complete 
         *      Create the new Review 
         ********************************************************/


        const insertResults = await this.database.query(`
                INSERT INTO reviews (paper_id, user_id, version, summary, recommendation, status, created_date, updated_date) 
                    VALUES ($1, $2, $3, $4, $5, $6, now(), now()) 
                    RETURNING id
                `, 
            [ paperId, userId, review.version, review.summary, review.recommendation, review.status ]
        )
        if ( insertResults.rows.length == 0 ) {
            throw new ControllerError(500, 'server-error', `User(${userId}) failed to insert a new review on Paper(${review.paperId})`)
        }

        review.id = insertResults.rows[0].id
        await this.reviewDAO.insertThreads(review) 

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
        const entity = results.dictionary[review.id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Failed to find newly inserted review ${review.id}.`)
        }

        if ( entity.status == 'submitted' ) {
            // Update the review count on the version
            await this.database.query(`
                UPDATE paper_versions SET review_count = review_count+1 WHERE paper_id = $1 AND version = $2
            `, [ paperId, review.version ])
        
            
            const event = {
                paperId: entity.paperId,
                actorId: userId,
                version: entity.version,
                type: 'review-posted',
                reviewId: entity.id
            }
            await this.paperEventService.createEvent(request.session.user, event)

            // ==== Notifications =============================================
            
            for(const author of paper.authors) {
                await this.notificationService.createNotification(
                    author.userId,
                    'author:new-review',
                    {
                        paper: paper,
                        review: entity,
                        reviewer: request.session.user
                    }

                )
            }

            const editorResults = await this.database.query(`
                SELECT user_id 
                    FROM journal_submission_editors 
                        LEFT OUTER JOIN journal_submissions ON journal_submission_editors.submission_id = journal_submissions.id
                    WHERE journal_submissions.paper_id = $1
            `, [ entity.paperId ])

            for ( const row of editorResults.rows ) {
                await this.notificationService.createNotification(
                    row.user_id,
                    'editor:new-review',
                    {
                        paper: paper,
                        review: entity,
                        reviewer: request.session.user
                    }
                )
            }

            // ==== END Notifications =========================================
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(201).json({ entity: entity, relations: results.relations })
    }

    /**
     * GET /paper/:paper_id/review/:review_id
     *
     * Get details for a single review in the database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we
     * want to get a review for.
     * @param {int} request.params.id   The database id of the review we want
     * to get.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getReview(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * We need to do basic input validation.
         *
         * 1. Review(:review_id) exists.
         * 2. Review(:review_id) is on Paper(:paper_id)
         *
         * Then we need to check the view permissions.  They are different
         * depending on whether Paper(:paper_id) is a draft or not.
         *
         * 3. Review(:review_id) is in-progress AND User is logged in AND User
         *      is author of Review(:review_id)
         * 4. Review(:review_id) is not in-progress AND Paper(:paper_id) is a
         *      draft AND User is logged in and has Review permissions.
         * 5. Review(:review_id) is not in-progress AND Paper(:paper_id) is NOT
         *      a draft. (Anyone may view.)
         *
         *
         * ***********************************************************/

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status"
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
            WHERE reviews.id = $1
        `, [ reviewId ])

        // 1. Review(:review_id) exists.
        if ( existingResults.rows.length < 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to POST thread to Review(${reviewId}), but it doesn't exist!`)
        }


        const existing = existingResults.rows[0]

        // 2. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch:paper', 
                `Review(${reviewId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 3. Review(:review_id) is in-progress AND User is logged in AND User
        //      is author of Review(:review_id)
        if ( existing.review_status == 'in-progress') {
            // ... AND User is logged in
            if ( ! request.session.user ) {
                // Return a 404, so we don't let them know that a review they
                // aren't allowed to see exists.
                throw new ControllerError(404, 'no-resource',
                    `Unauthenticated user attempted to view in-progress Review(${reviewId}).`)
            }

            // ...AND User is author of Review(:review_id)
            if ( existing.review_userId != request.session.user.id ) {
                // Return a 404, so we don't let them know that a review they
                // aren't allowed to see exists.
                throw new ControllerError(404, 'no-resource',
                    `User(${request.session.user.id}) attempted to view in-progress Review(${reviewId}) they didn't write.`)
            }
        }

        // 4. Review(:review_id) is not in-progress AND Paper(:paper_id) is a
        //      draft AND User is logged in and has Review permissions.

        if ( existing.review_status != 'in-progress' && existing.paper_isDraft ) {
            if ( ! request.session.user ) {
                // Return a 404, so we don't let them know that a review they
                // aren't allowed to see exists.
                throw new ControllerError(404, 'no-resource',
                    `Unauthenticated user attempted to view Review(${reviewId}) on draft Paper(${paperId}).`)
            }

        }

        // 5. Review(:review_id) is not in-progress AND Paper(:paper_id) is NOT
        //      a draft. (Anyone may view.)

        /********************************************************
         * Permissions Checks Complete
         *      Retrieve and Return the Review
         ********************************************************/

        // At this point, we've already confirmed that they are allowed to view this review.
        // So just retrieve it.
        const results = await this.reviewDAO.selectReviews(
            `WHERE reviews.id = $1`, 
            [ reviewId ]
        )
        if ( ! results.dictionary[reviewId] ) {
            throw new ControllerError(404, 'no-resource', 
                `Didn't find Review(${reviewId}).`)
        }

        results.relations = await this.getRelations(request.session.user, results)
        this.reviewDAO.selectVisibleComments(request.session?.user?.id, results.dictionary)

        return response.status(200).json({ entity: results.dictionary[reviewId], relations: results.relations })
    }

    /**
     * PUT /paper/:paper_id/review/:id
     *
     * Replace an existing review wholesale with the provided JSON.
     *
     * NOT IMPLEMENTED
     */
    async putReview(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `Attempt to call unimplemented PUT /paper/:paper_id/review/:id.`)

        //  ===================================================================
        //  ##############  Intentionally Left Unimplemented ##################
        // 
        //  This is not wired into the controller.  It is intentionally left 
        //  unimplemented because we don't actually want to allow users to
        //  replace their reviews wholesale in any circumstances.  They are
        //  allowed to edit select fields through PATCH.
        //
        //  ===================================================================
    }

    /**
     * PATCH /paper/:paper_id/review/:review_id
     *
     * Update an existing review given a partial set of fields in JSON.
     *
     * Only changes the top level resource (reviews, in this case).  Does
     * nothing with children (comments).
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper we want to edit
     * a review on.
     * @param {int} request.params.review_id    The id of the review we wish to
     * edit.
     * @param {Object} request.body The review patch that will be used to edit
     * Review(:review_id) by overwriting the included fields.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchReview(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id

        const review = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be the author of Review(:review_id) OR an owning author of
         * Paper(:paper_id)
         *
         * Then we need to do basic input validation:
         *
         * 3. Review(:review_id) exists.
         * 4. Review(:review_id) is on Paper(:paper_id)
         *
         * We need to check that this review may be editted:
         *
         * 5. Paper(:paper_id) is a draft.
         * 6. Review(:review_id) is in progress or User is paper author and
         *      patch is changing status to 'accepted' or 'rejected'.
         *
         * Finally, we need to validate the review content (PATCH body): 
         *
         * 7. Paper authors may only edit the `status` field.
         * 8. Review authors may only edit the `status`, `summary`, and `recommendation`
         * fields. Status may only be 'submitted' when it is currently 'in-progress'.
         * 9. No one may PATCH `paperId`, `userId`, `version`, or `number`
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to PATCH review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status"
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
            WHERE reviews.id = $1
        `, [ reviewId ])

        // 3. Review(:review_id) exists.
        if ( existingResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to POST thread to Review(${reviewId}), but it doesn't exist!`)
        }

        const existing = existingResults.rows[0]

        // 4. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch:paper', 
                `Review(${reviewId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        const isReviewAuthor = (existing.review_userId == userId)
        let paperAuthor = null

        // 2. Be the author of Review(:review_id)...
        if ( ! isReviewAuthor ) {

            // ... OR an owning author of Paper(:paper_id)
            const paperAuthorsResults = await this.database.query(`
                SELECT user_id as "userId", owner FROM paper_authors where paper_id = $1
             `, [ paperId ])

            if ( paperAuthorsResults.rows.length <= 0 ) {
                throw new ControllerError(403, 'not-authorized:not-author',
                    `User(${userId}) attempted to PATCH Review(${reviewId}) that they did not write on a Paper(${paperId}) they are not an owning author on.`)
            }

            paperAuthor = paperAuthorsResults.rows.find((a) => a.userId == userId)
            if ( ! paperAuthor || ! paperAuthor.owner ) {
                throw new ControllerError(403, 'not-authorized:not-owning-author',
                    `User(${userId}) attempted to PATCH Review(${reviewId}) that they did not write on a Paper(${paperId}) they are not an owning author on.`)

            }
        }

        // 5. Paper(:paper_id) is a draft.
        if ( ! existing.paper_isDraft ) {
            throw new ControllerError(403, 'not-authorized:published-paper', 
                `User(${userId}) attempted to PATCH a review on a published Paper(${paperId}).`)
        }

        // 6. Review(:review_id) is in progress or User is paper author and patch is changing status to 'accepted' or 'rejected'.
        if (existing.review_status != 'in-progress' && ! ( paperAuthor && ( review.status == 'accepted' || review.status == 'rejected')) ) {
            throw new ControllerError(403, 'not-authorized:not-in-progress',
                `User(${userId}) attempted to PATCH Review(${reviewId}), but it was not in progress.`)
        }

        // 7. Paper authors may only edit the `status` field.
        if ( ! isReviewAuthor && (review.summary || review.recommendation)) {
            throw new ControllerError(403, 'not-authorized:forbidden-fields', 
                `User(${userId}) attempted to PATCH forbidden fields on Review(${reviewId}).`)
        }

        // 8. Review authors may only edit the `summary` and `recommendation`
        // fields, or the `status` field if they are setting it to 'submitted'.
        if ( isReviewAuthor && review.status && review.status != 'submitted') {
            throw new ControllerError(403, 'not-authorized:forbidden-fields', 
                `User(${userId}) attempted to PATCH forbidden fields on Review(${reviewId}).`)
        }

        // 9. No one may PATCH `paperId`, `userId`, `version`, or `number`
        if ( review.paperId || review.userId || review.version || review.number ) {
            throw new ControllerError(403, 'not-authorized:forbidden-fields', 
                `User(${userId}) attempted to PATCH forbidden fields on Review(${reviewId}).`)
        }

        /********************************************************
         * Execute the Update
         ********************************************************/
        // We want to use the ids in params over any id in the body.
        review.id = reviewId 
        review.paperId = paperId 

        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors), that we let the
        // database handle (date fields, id, etc), or that we disallow editing
        // for functional reasons.
        //
        // In this case, we only allow editting of summary, recommandation, and
        // status.
        const ignoredFields = [ 'id', 'paperId', 'userId', 'version', 'number', 'threads', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE reviews SET '
        let params = []
        let count = 1
        for(let key in review) {
            if (ignoredFields.includes(key)) {
                continue
            }

            sql += key + ' = $' + count + ', '

            params.push(review[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(review.id)

        const updateResults = await this.database.query(sql, params)

        if ( updateResults.rowCount == 0 ) {
            throw new ControllerError(500, 'server-error', 
                `User(${userId}) failed to update Review(${review.id}).`)
        }

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ review.id ])
        if ( ! results.dictionary[review.id] ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Review(${review.id}) after User(${userId}) updated it.`)
        }

        const entity = results.dictionary[review.id]

        if ( existing.review_status != 'submitted' && results.dictionary[review.id].status == 'submitted' ) {
            // Update the review count on the version
            await this.database.query(`
                UPDATE paper_versions SET review_count = review_count+1 WHERE paper_id = $1 AND version = $2
            `, [ entity.paperId, entity.version ])

            // ==== Paper Events ==============================================
            
            const event = {
                paperId: entity.paperId,
                actorId: entity.userId,
                version: entity.version,
                type: 'review-posted',
                reviewId: entity.id
            }
            await this.paperEventService.createEvent(request.session.user, event)

            const paperResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ review.paperId ])
            const paper = paperResults.dictionary[review.paperId]

            // ==== Notifications =============================================
            
            for(const author of paper.authors) {
                await this.notificationService.createNotification(
                    author.userId,
                    'author:new-review',
                    {
                        paper: paper,
                        review: entity,
                        reviewer: request.session.user
                    }

                )
            }

            const editorResults = await this.database.query(`
                SELECT user_id 
                    FROM journal_submission_editors 
                        LEFT OUTER JOIN journal_submissions ON journal_submission_editors.submission_id = journal_submissions.id
                    WHERE journal_submissions.paper_id = $1
            `, [ entity.paperId ])

            for ( const row of editorResults.rows ) {
                await this.notificationService.createNotification(
                    row.user_id,
                    'editor:new-review',
                    {
                        paper: paper,
                        review: entity,
                        reviewer: request.session.user
                    }
                )
            }

            // ==== END Notifications =========================================


        }

        results.relations = await this.getRelations(request.session.user, results)
        this.reviewDAO.selectVisibleComments(userId, results.dictionary)

        return response.status(200).json({ entity: entity, relations: results.relations })
    }

    /**
     * DELETE /paper/:paper_id/review/:review_id
     *
     * Delete an existing review.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper the review we
     * wish to delete is attached to.
     * @param {int} request.params.review_id    The id of the review we wish to
     * delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteReview(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be the author of Review(:review_id)
         *
         * Then we need to do basic input validation:
         *
         * 3. Review(:review_id) exists.
         * 4. Review(:review_id) is on Paper(:paper_id)
         *
         * Finally we need to check that this review may be deleted:
         *
         * 5. Paper(:paper_id) is a draft.
         * 6. Review(:review_id) is in progress.
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to DELETE review on Paper(${paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status"
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
            WHERE reviews.id = $1
        `, [ reviewId ])

        // 3. Review(:review_id) exists.
        if ( existingResults.rows.length < 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to POST thread to Review(${reviewId}), but it doesn't exist!`)
        }

        const existing = existingResults.rows[0]

        // 2. Be the author of Review(:review_id)
        if ( existing.review_userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to DELETE Review(${reviewId}) that they did not write.`)
        }

        // 4. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch', 
                `Review(${reviewId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 5. Paper(:paper_id) is a draft.
        if ( ! existing.paper_isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${paperId}).`)
        }

        // 6. Review(:review_id) is in progress.
        if (existing.review_status != 'in-progress' ) {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempted to PUT Review(${reviewId}), but it was not in progress.`)
        }

        /********************************************************
         * Execute the Update
         ********************************************************/

        const results = await this.database.query(
            'delete from reviews where id = $1',
            [ reviewId ]
        )

        if ( results.rowCount == 0) {
            throw new ControllerError(500, 'server-error', `Failed to delete review ${reviewId}.`)
        }

        return response.status(200).json({ id: reviewId })
    }

    /**
     * /paper/:paper_id/review/:review_id/threads
     *
     * Start a new comment thread on a paper.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper the review we
     * want to add a thread to is on.
     * @param {int} request.params.reivew_id The id of the review we want to
     * add a thread to.
     * @param {Object} request.body The `review_thread` we're creating.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postThreads(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be the author of Review(:review_id)
         *
         * Then we need to do basic data validation: 
         *
         * 3. Review(:review_id) exists.
         * 4. Review(:review_id) is on Paper(:paper_id)
         *
         * NOTE: We don't need to validate that the POSTED threads have
         * thread.reviewId = :review_id, because we just override it and set it
         * to :review_id.
         *
         * Finally, we need to check that the paper and review are in a state
         * that allows a new thread to be created:
         *
         * 5. Paper(:paper_id) is a draft.
         * 6. Review(:review_id) is in progress.
         *
         * ***********************************************************/

        // 1. Be logged in.
        // Have to be authenticated to add a comment thread to a review.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to POST review thread on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status"
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
            WHERE reviews.id = $1
        `, [ reviewId ])

        // 3. Review(:review_id) exists.
        if ( existingResults.rows.length < 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to POST thread to Review(${reviewId}), but it doesn't exist!`)
        }

        const existing = existingResults.rows[0]

        // 2. Be the author of Review(:review_id)
        if ( existing.review_userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempting to add comment thread to Review(${reviewId}) when not authorized.`)
        }

        // 4. Review(:review_id) is on Paper(:paper_id)
        if ( ! existing.paper_id == paperId) {
            throw new ControllerError(400, 'id-mismatch',
                `Review(${reviewId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 5. Paper(:paper_id) is a draft.
        if ( ! existing.paper_isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }


        // 6. Review(:review_id) is in progress
        if ( existing.review_status != 'in-progress') {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempting to add a new thread to Review(${reviewId}) after it has been submitted.`)
        }

        /********************************************************
         * Permissions Check Complete
         *      Execute the POST 
         * *****************************************************/

        let threads = []
        if ( ! request.body.length ) {
            threads.push(request.body)
        } else {
            threads = request.body
        }

        const review = {
            id: reviewId,
            paperId: paperId,
            threads: threads
        }
        let threadIds = [] 

        threadIds = await this.reviewDAO.insertThreads(review)

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! results.dictionary[reviewId] ) {
            throw new ControllerError(500, 'server-error', 
                `Failed to find review ${reviewId} after inserting new threads.`)
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ entity: results.dictionary[reviewId], threadIds: threadIds, relations: results.relations })
    }

    /**
     * DELETE /paper/:paper_id/review/:review_id/thread/:thread_id
     *
     * Delete a comment thread.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper this review and
     * thread are attached to.
     * @param {int} request.params.review_id The id of the review this thread
     * is attached to.
     * @param {int} request.params.thread_id The id of the thread we wish to
     * delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteThread(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id

        /*************************************************************
         * Permissions Checking, Input Validation, and Error handling
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be the author of Review(:review_id)
         *
         * Additionally, we need to do basic input checks:
         *
         * 3. Thread(:thread_id) exists.
         * 4. Thread(:thread_id) is on Review(:review_id).
         * 5. Review(:review_id) is on Paper(:paper_id)
         *
         * Finally we need to confirm the paper and review are in an editable
         * state:
         *
         * 6. Paper(:paper_id) is a draft.
         * 7. Review(:review_id) is in progress.
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to DELETE review thread on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status",
                review_comment_threads.id as thread_id
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
                JOIN review_comment_threads on review_comment_threads.review_id = reviews.id
            WHERE review_comment_threads.id = $1
        `, [ threadId ])

        // 3. Thread(:thread_id) exists. 
        if ( existingResults.rows.length < 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to POST thread to Review(${reviewId}), but it doesn't exist!`)
        }

        const existing = existingResults.rows[0]

        // 2. Be author of Review(:review_id)
        if ( existing.review_userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempting to delete comment thread from Review(${reviewId}) when not authorized.`)
        }

        // 4. Thread(:thread_id) is on Review(:review_id).
        if ( existing.review_id != reviewId ) {
            throw new ControllerError(400, 'id-mismatch',
                `Thread(${threadId}) is on Review(${existing.review_id}) not Review(${reviewId}).`)
        }

        // 5. Review(:review_id) is on Paper(:paper_id).
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch',
                `Review(${reviewId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 6. Paper(:paper_id) is a draft.
        if ( ! existing.paper_isDraft ) {
            throw new ControllerError(400, 'published-paper', 
                `User(${userId}) attempted to add a review to published Paper(${review.paperId}).`)
        }

        // 7. Review(:review_id) is in progress.
        if ( existing.review_status != 'in-progress') {
            throw new ControllerError(400, 'not-in-progress',
                `User(${userId}) attempted to add a thread to Review(${reviewId}) that was not in progress.`)
        }

        /********************************************************
         * Permissions Check Complete
         *      Execute the DELETE 
         * *****************************************************/

        const deleteResults = await this.database.query('DELETE FROM review_comment_threads WHERE id = $1', [ threadId ])
        if ( deleteResults.rowCount == 0) {
            throw new ControllerError(500, 'server-error',
                `Attempted to delete review comment Thread(${threadId}), but deleted nothing.`)
        }

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! results.dictionary[reviewId] ) {
            throw new ContollerError(500, 'server-error', 
                `Failed to find review ${reviewId} after deleting thread ${threadId}.`)
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ entity: results.dictionary[reviewId], relations: results.relations })
    }

    /**
     * POST /paper/:paper_id/review/:review_id/thread/:thread_id/comments
     *
     * Add a comment to an existing thread.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper we want to add
     * review comments to.
     * @param {int} request.params.review_id The id of the review we want to
     * add a comment to.
     * @param {int} request.params.thread_id The id of the thread we want to
     * add a comment to.
     * @param {Object} request.body The comment object we want to create.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postComments(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id

        let comments = []
        if ( ! request.body.length ) {
            comments.push(request.body)
        } else {
            comments = request.body
        }

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be author of Review(:review_id) 
         *      OR have Review permissions on Paper(:paper_id) 
         *
         * Next we need to do basic input checks:
         *
         * 3. Thread(:thread_id) exists.
         * 4. Thread(:thread_id) is on Review(:review_id).
         * 5. Review(:review_id) is on Paper(:paper_id)
         *
         * Then we need to confirm that the paper and review are in a state
         * that allows posting comments:
         *
         * 6. Paper(:paper_id) is a draft.
         * 7. Review(:review_id) is NOT in progress 
         *      OR user is author of Review(:review_id)
         *
         * Finally, we need to validate the posted data:
         *
         * 8. Each posted comment should have UserId as comment.userId.
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to POST review on Paper(${review.paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(
            `SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as review_status
                FROM papers 
                    JOIN reviews on papers.id = reviews.paper_id
                    JOIN review_comment_threads on review_comment_threads.review_id = reviews.id
                WHERE review_comment_threads.id = $1
            `, [ threadId ]
        )

        // 3. Thread(:thread_id) exists.
        if ( existingResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Thread(${threadId}) found.`)
        }

        const existing = existingResults.rows[0]

        // 4. Thread(:thread_id) is on Review(:review_id)
        if ( existing.review_id != reviewId ) {
            throw new ControllerError(400, 'id-mismatch:review',
                `Thread(${threadId}) is on Review(${existing.review_id}) not Review(${reviewId}).`)
        }

        // 5. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch:paper', 
                `Thread(${threadId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 6. Paper(:paper_id) is a draft.
        const isDraft = existing.paper_isDraft
        if ( ! isDraft ) {
            throw new ControllerError(403, 'not-authorized:published-paper', 
                `User(${userId}) attempted to add a review comment to published Paper(${paperId}).`)
        }

        const isAuthor = (existing.review_userId == userId)

        //  2. Be author of the review...
        if ( ! isAuthor ) {
            // ...OR have Review permissions on Paper(:paper_id)
        }

        // 7. Review(:review_id) is NOT in progress 
        //      OR user is author of Review(:review_id)
        if ( existing.review_status == 'in-progress' && ! isAuthor ) {
            throw new ControllerError(403, 'not-authorized:not-review-author',
                `User(${userId}) attempting to add comment to in-progress Review(${reviewId}) they didn't start.`)
        }

        // 8. Each posted comment should have UserId as comment.userId.
        for( const comment of comments ) {
            if ( comment.userId != userId) {
                throw new ControllerError(403, 'not-authorized:not-comment-author',
                    `User(${userId}) attempting to add comments for User(${comment.userId}).`)
            }
        }

        /********************************************************
         * Permissions Check Complete
         *      Execute the POST 
         * *****************************************************/

        // TODO Override threadOrder and number.  Only allow comments to
        // appended to the end of their thread, and enforce that here.

        for (const comment of comments ) {
            // TECHDEBT -- Issue #171 -- ReviewDAO::insertComment handles
            // the creation of the initial version.  Ideally, we would
            // handle version creation either entirely in the controller or
            // entirely in the DAO, but because of the way we create
            // comments as a subordinate object of threads and reviews,
            // that's not actually an easy thing to do.
            await this.reviewDAO.insertComment(comment)
        }

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id=$1`, [ reviewId ])
        if ( ! results.dictionary[reviewId] ) {
            throw new Error(`Failed to find review ${reviewId} after adding comments.`)
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ entity: results.dictionary[reviewId], relations: results.relations })
    }

    /**
     * PATCH /paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id
     *
     * Edit a review comment.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper.
     * @param {int} request.params.review_id The id of the review.
     * @param {int} request.params.thread_id The id of the thread.
     * @param {int} request.params.comment_id The id of the comment we want to
     * patch.
     * @param {int} request.body The patch for Comment(:comment_id).  Contains
     * partial data, with the included fields overwriting the database.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchComment(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id
        const commentId = request.params.comment_id

        const comment = request.body
        comment.id = commentId

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be author of Comment(:comment_id).
         * 
         * We need to do basic input validation:
         *
         * 3. Comment(:comment_id) exists.
         * 4. Comment(:comment_id) is in Thread(:thread_id).
         * 5. Thread(:thread_id) is on Review(:review_id).
         * 6. Review(:review_id) is on Paper(:paper_id)
         *
         * We need to make sure that the paper, review, and comment are in a
         * PATCHable state:
         *
         * 7. Paper(:paper_id) is a draft.
         * 8. Review(:review_id) is in progress AND User is author of Review(:review_id)
         *      OR Comment(:comment_id) is in progress AND User is author of Comment(:comment_id)
         *
         * Finally we need to validate the comment body:
         *
         * 9. comment.userId must be userId
         * 10. Only `status` and `content` may be changed.
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to DELETE comment on Paper(${paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status",
                review_comment_threads.id as thread_id,
                review_comments.user_id as "comment_userId", review_comments.status as "comment_status"
                ${ this.core.features.hasFeature('review-comment-versions-171') ? ', review_comments.version as "comment_version"' : '' }
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
                JOIN review_comment_threads on review_comment_threads.review_id = reviews.id
                JOIN review_comments on review_comments.thread_id = review_comment_threads.id
            WHERE review_comments.id = $1
        `, [ commentId ])

        // 3. Comment(:comment_id) exists.
        if ( existingResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Thread(${threadId}) found.`)
        }

        const existing = existingResults.rows[0]

        // 4. Comment(:comment_id) is in Thread(:thread_id)
        if ( existing.thread_id != threadId ) {
            throw new ControllerError(400, 'id-mismatch:thread',
                `Comment(${commentId}) is on Thread(${existing.thread_id}) not Thread(${threadId}).`)
        }

        // 5. Thread(:thread_id) is on Review(:review_id)
        if ( existing.review_id != reviewId ) {
            throw new ControllerError(400, 'id-mismatch:review',
                `Thread(${threadId}) is on Review(${existing.review_id}) not Review(${reviewId}).`)
        }

        // 6. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch:paper', 
                `Thread(${threadId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 7. Paper(:paper_id) is a draft.
        const isDraft = existing.paper_isDraft
        if ( ! isDraft ) {
            throw new ControllerError(403, 'not-authorized:published-paper', 
                `User(${userId}) attempted to PATCH a comment to published Paper(${paperId}).`)
        }

        const isReviewAuthor = (existing.review_userId == userId) 
        const isCommentAuthor = (existing.comment_userId == userId)

        //  2. Be author of Comment(:comment_id)
        if ( ! isCommentAuthor ) {
            throw new ControllerError(403, 'not-authorized:not-comment-author', 
                `Unauthorized User(${userId}) attempting to PATCH Comment(${commentId}).`)
        }

        // 8. Review(:review_id) is in progress AND User is author of Review(:review_id)
        //       OR Comment(:comment_id) is in progress AND User is author of Comment(:comment_id)
        //
        //       This is a complex one to invert.
        //
        // If the review is in progress and they are not the reviewAuthor, then
        // we know they can't be here.
        if ( existing.review_status == 'in-progress' && ! isReviewAuthor ) {
            throw new ControllerError(403, 'not-authorized:not-review-author', 
                `Unauthorized User(${userId}) attempting to PATCH Comment(${commentId}).`)
        }

        // Otherwise, the review either isn't in-progress or they are the review author.  We already know
        // they are the comment author by this point, because we checked that earlier.
        //
        // At this point, they can only edit their comment if one of two conditions exist:
        //
        // - The review is in-progress, in which case they can edit to their hearts content.
        // - The review is not in progress but the comment is in-progress, in
        // which case they can edit until they hit "submit" and it is changed
        // to no longer be in-progress, at which point they cannot edit
        // anymore.
        //
        // Which means, if neither the Review nor the Comment is in progress, we should leave.
        if (existing.review_status != 'in-progress' && existing.comment_status != 'in-progress' ) {
            throw new ControllerError(403, 'not-authorized:not-in-progress', 
                `Unauthorized User(${userId}) attempting to PATCH Comment(${commentId}).`)
        }

        // 9. comment.userId must be userId
        if ( comment.userId && comment.userId != userId ) {
            throw new ControllerError(403, 'not-authorized:change-author',
                `User(${userId}) attempting to change comment author to User(${comment.userId}).`)
        }

        // 10. Only `status` and `content` may be changed.
        if ( comment.userId || comment.threadId || comment.number || comment.threadOrder ) {
            throw new ControllerError(403, 'not-authorized:field',
                `User(${userId}) attempting to PATCH unauthorized fields on Comment(${commentId}).`)
        }

        /********************************************************
         * Permissions Check Complete
         *      Execute the PATCH 
         * *****************************************************/

        // TODO Handle patching and versioning here.  We'll need to introduce a
        // new `revert` status that can allow a PATCH request to rollback to
        // previous version.
      
        // If we're transitioning from 'edit-in-progress' to 'reverted' we need
        // to replace the comment with the most recent version.
        if ( this.core.features.hasFeature('review-comment-versions-171') && existing.comment_status == 'edit-in-progress' && comment.status == 'reverted' ) {
            // Since we don't update the version until it goes from
            // 'in-progress' to 'posted', we can just retrieve the content from
            // the current version in the version table.
            const previousVersionResult = await this.database.query(`SELECT content FROM review_comment_versions WHERE comment_id = $1 AND version = $2`, [ commentId, existing.comment_version ])

            if ( previousVersionResult.rows.length <= 0 ) {
                throw new ControllerError(500, 'no-version',
                    `Attempt to revert to a previous version (${existing.comment_version}) of Comment(${commentId}), but version doesn't exist!`)
            } else if ( previousVersionResult.rows.length > 1 ) {
                throw new ControllerError(500, 'multiple-versions', `Found multiple instances of version(${existing.comment_version}) for Comment(${commentId}).`)
            }

            const newComment = {
                id: commentId,
                status: 'posted',
                content: previousVersionResult.rows[0].content
            }

            await this.reviewDAO.updateComment(newComment)

        } else {
            if ( this.core.features.hasFeature('review-comment-versions-171') ) {
                // We need to create a new version the first time the comment is
                // transitioned from 'in-progress' to 'posted'. 
                if ( existing.comment_status == 'in-progress' && comment.status == 'posted') {
                    comment.version = await this.reviewDAO.insertCommentVersion(comment, existing.comment_version)

                }

                // We need to create a new version every time it's transitioned from
                // 'edit-in-progress' to 'posted'.
                if ( existing.comment_status == 'edit-in-progress' && comment.status == 'posted') {
                    comment.version = await this.reviewDAO.insertCommentVersion(comment, existing.comment_version)
                }
            }

            // Now that we know the version, update the comment. 
            await this.reviewDAO.updateComment(comment)
        }


        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ reviewId ])
        if ( ! results.dictionary[reviewId] ) {
            throw new ControllerError(500, 'server-error', 
                `Failed to find Review(${reviewId}) after updating related Comment(${commentId}).`)
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ entity: results.dictionary[reviewId], relations: results.relations })
    }

    /**
     * DELETE /paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id
     *
     * Delete a comment.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The id of the paper.
     * @param {int} request.params.review_id The id of the review.
     * @param {int} request.params.thread_id The id of the thread.
     * @param {int} request.params.comment_id The id of the comment we wish to
     * delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteComment(request, response) {
        const paperId = request.params.paper_id
        const reviewId = request.params.review_id
        const threadId = request.params.thread_id
        const commentId = request.params.comment_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To call this endpoint you must:
         *
         * 1. Be logged in.
         * 2. Be author of Comment(:comment_id).
         * 
         * Additionally, we need to do basic input validation:
         *
         * 3. Comment(:comment_id) exists.
         * 4. Comment(:comment_id) is in Thread(:thread_id).
         * 5. Thread(:thread_id) is on Review(:review_id).
         * 6. Review(:review_id) is on Paper(:paper_id)
         *
         * And then we need to check that the comment may be deleted:
         *
         * 7. Paper(:paper_id) is a draft.
         * 8. Review(:review_id) is in progress AND User is author of Review(:review_id)
         *      OR Comment(:comment_id) is in progress AND User is author of Comment(:comment_id)
         *
         * ***********************************************************/

        // 1. Be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 
                'not-authenticated', `Unauthenticated user attempted to DELETE comment on Paper(${paperId}).`)
        }

        const userId = request.session.user.id

        const existingResults = await this.database.query(`
            SELECT 
                papers.id as paper_id, papers.is_draft as "paper_isDraft",
                reviews.id as review_id, reviews.user_id as "review_userId", reviews.status as "review_status",
                review_comment_threads.id as thread_id,
                review_comments.user_id as "comment_userId", review_comments.status as "comment_status"
            FROM reviews
                JOIN papers on reviews.paper_id = papers.id
                JOIN review_comment_threads on review_comment_threads.review_id = reviews.id
                JOIN review_comments on review_comments.thread_id = review_comment_threads.id
            WHERE review_comments.id = $1
        `, [ commentId ])

        // 3. Comment(:comment_id) exists.
        if ( existingResults.rows.length <= 0) {
            throw new ControllerError(404, 'no-resource', `No Thread(${threadId}) found.`)
        }

        const existing = existingResults.rows[0]

        // 4. Comment(:comment_id) is in Thread(:thread_id)
        if ( existing.thread_id != threadId ) {
            throw new ControllerError(400, 'id-mismatch',
                `Comment(${commentId}) is on Thread(${existing.thread_id}) not Thread(${threadId}).`)
        }

        // 5. Thread(:thread_id) is on Review(:review_id)
        if ( existing.review_id != reviewId ) {
            throw new ControllerError(400, 'id-mismatch',
                `Thread(${threadId}) is on Review(${existing.review_id}) not Review(${reviewId}).`)
        }

        // 6. Review(:review_id) is on Paper(:paper_id)
        if ( existing.paper_id != paperId) {
            throw new ControllerError(400, 'id-mismatch', 
                `Thread(${threadId}) is on Paper(${existing.paper_id}) not Paper(${paperId}).`)
        }

        // 7. Paper(:paper_id) is a draft.
        const isDraft = existing.paper_isDraft
        if ( ! isDraft ) {
            throw new ControllerError(400,
                'published-paper', `User(${userId}) attempted to DELETE a comment to published Paper(${paperId}).`)
        }

        const isReviewAuthor = (existing.review_userId == userId) 
        const isCommentAuthor = (existing.comment_userId == userId)

        //  2. Be author of Comment(:comment_id)
        if ( ! isCommentAuthor ) {
            throw new ControllerError(403, 
                'not-authorized', `Unauthorized User(${userId}) attempting to DELETE Comment(${commentId}). (Not comment author.)`)
        }

        // 8. Review(:review_id) is in progress AND User is author of Review(:review_id)
        //       OR Comment(:comment_id) is in progress AND User is author of Comment(:comment_id)
        //
        //       This is a complex one to invert.
        //
        // If the review is in progress and they are not the reviewAuthor, then
        // we know they can't be here.
        if ( existing.review_status == 'in-progress' && ! isReviewAuthor ) {
            throw new ControllerError(403, 
                'not-authorized', `Unauthorized User(${userId}) attempting to DELETE Comment(${commentId}). (Not review author.)`)
        }

        // Otherwise, the review either isn't in-progress or they are the review author.  We already know
        // they are the comment author by this point, because we checked that earlier.
        //
        // At this point, they can only edit their comment if one of two conditions exist:
        //
        // - The review is in-progress, in which case they can edit to their hearts content.
        // - The review is not in progress but the comment is in-progress, in
        // which case they can edit until they hit "submit" and it is changed
        // to no longer be in-progress, at which point they cannot edit
        // anymore.
        //
        // Which means, if neither the Review nor the Comment is in progress, we should leave.
        if (existing.review_status != 'in-progress' && existing.comment_status != 'in-progress' ) {
            throw new ControllerError(403, 
                'not-authorized', `Unauthorized User(${userId}) attempting to DELETE Comment(${commentId}). (Not in progress.)`)
        }




        /********************************************************
         * Permissions Check Complete
         *      Execute the DELETE 
         * *****************************************************/
        
        // If this is the last comment in the thread, then we want to
        // delete the whole thread.
        const threadResults = await this.database.query(`
            SELECT 
                count(id), thread_id 
            FROM review_comments 
            WHERE thread_id in (SELECT thread_id FROM review_comments WHERE id = $1) group by thread_id`, [ commentId ])
        if ( threadResults.rows.length > 0 && threadResults.rows[0].count == 1) {
            const deleteResults = await this.database.query(`DELETE FROM review_comment_threads WHERE id = $1`, [ threadResults.rows[0].thread_id ])

            if ( deleteResults.rowCount == 0) {
                throw new ControllerError(500, 'server-error', 
                    `Failed to delete Thread(${threadResults.rows[0].thread_id})`)
            }
        } else {
            const deleteResults = await this.database.query('DELETE FROM review_comments WHERE id = $1', [ commentId ])

            if ( deleteResults.rowCount == 0 ) {
                throw new ControllerError(500, 'server-error', 
                    `Failed to delete Comment(${commentId}).`)
            }
        }

        const results = await this.reviewDAO.selectReviews(`WHERE reviews.id = $1`, [ reviewId ])
        if ( ! results.dictionary[reviewId] ) {
            throw new ControllerError(500, 'server-error', 
                `Failed to find Review(${reviewId}) after updating related Comment(${commentId}).`)
        }

        this.reviewDAO.selectVisibleComments(userId, results.dictionary)
        results.relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ entity: results.dictionary[reviewId], relations: results.relations })
    }



} 
