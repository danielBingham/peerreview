/******************************************************************************
 * JournalController
 *
 * Restful routes for manipulating journals.
 *
 ******************************************************************************/

const { 
    JournalDAO, 
    JournalSubmissionDAO, 
    PaperDAO, 
    UserDAO, 
    DAOError,
    SessionService,
    NotificationService
} = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class JournalController {

    constructor(core) {
        this.core = core

        this.journalDAO = new JournalDAO(this.core)
        this.journalSubmissionDAO = new JournalSubmissionDAO(this.core)
        this.paperDAO = new PaperDAO(this.core)
        this.userDAO = new UserDAO(this.core)

        this.sessionService = new SessionService(this.core)
        this.notificationService = new NotificationService(this.core)
    }

    async getRelations(results, requestedRelations) {
        const relations = {}

        // Always get journal.members[].user

        const userIds = []
        for(const id of results.list) {
            for(const member of results.dictionary[id].members) {
                userIds.push(member.userId) 
            }
        }
        const userResults = await this.userDAO.selectCleanUsers('WHERE users.id = ANY($1::bigint[])', [ userIds ])
        relations.users = userResults.dictionary

        if ( requestedRelations ) {
            // Query for the requested related objects.
            for(const relation of requestedRelations) {
                if ( relation == 'submissions') {
                    const submissionResults = await this.journalSubmissionDAO.selectJournalSubmissions(
                        'WHERE journal_submissions.journal_id = ANY($1::bigint[])',
                        [ results.list ]
                    )
                    relations.submissions = submissionResults.dictionary

                    const paperIds = []
                    for(const submission of submissionResults.list) {
                        if ( submission.paperId ) {
                            paperIds.push(submission.paperId)
                        }
                    }
                    const paperResults = await this.paperDAO.selectPapers('where papers.id = ANY($1::bigint[])', [ paperIds ])
                    relations.papers = paperResults.dictionary
                }
            }
        }
        return relations
    }

    /**
     * Parse a query string from the `GET /journals` endpoint for use with both
     * `JournalDAO::selectJournals()` and `JournalDAO::countJournals()`.
     *
     * @param {Object} query    The query string (from `request.query`) that we
     * wish to parse.
     * @param {string} query.name   (Optional) A string to compare to journal's name for
     * matches.  Compared using trigram matching.
     * @param {int} query.page    (Optional) A page number indicating which page of
     * results we want.  
     * @param {string} query.sort (Optional) A sort parameter describing how we want
     * to sort journals.
     * @param {Object} options  A dictionary of options that adjust how we
     * parse it.
     * @param {boolean} options.ignorePage  Skip the page parameter.  It will
     * still be in the result object and will default to `1`.
     *
     * @return {Object} A result object with the results in a form
     * understandable to `selectJournals()` and `countJournals()`.  Of the following
     * format:
     * ```
     * { 
     *  where: 'WHERE ...', // An SQL where statement.
     *  params: [], // An array of paramters matching the $1,$2, parameterization of `where`
     *  page: 1, // A page parameter, to select which page of results we want.
     *  order: '', // An SQL order statement.
     *  emptyResult: false // When `true` we can skip the selectJournals() call,
     *  // because we know we have no results to return.
     * }
     * ```
     */
    async parseQuery(query, options) {
        options = options || {
            ignorePage: false
        }
        
        const result = {
            where: 'WHERE',
            params: [],
            page: 1,
            order: '',
            emptyResult: false,
            requestedRelations:  ( query.relations ? query.relations : [] )
        }

        let count = 1


        if ( query.name && query.name.length > 0) {
            const and = count > 1 ? ' AND ' : ''

            result.where += `${and} SIMILARITY(journals.name, $${count}) > 0`
            result.order = `SIMILARITY(journals.name, $${count}) desc`

            result.params.push(query.name)
            count += 1
        }

        if ( query.userId ) {
            const memberResults = await this.core.database.query(
                `SELECT journal_id FROM journal_members WHERE user_id = $1 AND (permissions = 'editor' OR permissions = 'owner')`, 
                [ query.userId ]
            )

            const journalIds = memberResults.rows.map((r) => r.journal_id) 
            

            const and = count > 1 ? ' AND ' : ''
            result.where += `${and} journals.id = ANY($${count}::bigint[])`

            result.params.push(journalIds)
            count += 1
        }


        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        if ( query.sort == 'newest' ) {
            result.order = 'journals.created_date desc'
        } else if ( query.sort = 'alphabetical' ) {
            result.order = 'journals.name asc'
        }


        // If we haven't added anything to the where clause, then clear it.
        if ( result.where == 'WHERE') {
            result.where = ''
        }

        return result

    }

    /**
     * GET /journals
     *
     * Get a list of journals. 
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.query.name   (Optional) A string to compare to
     * journal's names for matches.  Compared using trigram matching.
     * @param {int} request.query.page    (Optional) A page number indicating
     * which page of results we want.  
     * @param {string} request.query.sort (Optional) A sort parameter
     * describing how we want to sort journals.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getJournals(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/

        const { where, params, order, page, emptyResult, requestedRelations} = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                result: [],
                relations: {}
            })
        }

        const results = await this.journalDAO.selectJournals(where, params, order, page)
        results.meta = await this.journalDAO.countJournals(where, params, page)

        results.relations = await this.getRelations(results, requestedRelations) 

        return response.status(200).json(results)
    }

    /**
     * POST /journals
     *
     * Create a new journal in the database from the provided JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postJournals(request, response) {
        const journal = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 2. Authenticated user must be JournalUser with 'owner' permissions.
         *
         * Data validation:
         *
         * 3. Journal has at least 1 valid user.
         * 
         * **********************************************************/

        // 1. User is authenticated.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        // 2. Authenticated user must be JournalUser with 'owner' permissions.
        // 3. Journal has at least 1 valid user.
        if ( ! journal.members.find((m) => m.userId == user.id && m.permissions == 'owner' )) {
            throw new ControllerError(403, 'not-authorized:not-owner',
                `User(${user.id}) attempted to create a journal without being the owning member!`)
        }

        /********************************************************
         * Permission Checks and Validation Complete
         *       Execute the POST
         ********************************************************/
        const client = await this.core.database.connect()
        const journalTransactionDAO = new JournalDAO(this.core, client)
        client.query(`BEGIN`)
        try {
            journal.id = await journalTransactionDAO.insertJournal(journal)

            for(const member of journal.members) {
                await journalTransactionDAO.insertJournalMember(journal.id, member)
            }
           
            await client.query(`COMMIT`)
        } catch (error ) {
            await client.query(`ROLLBACK`)
            throw error
        } finally {
            client.release()
        }

        const results  = await this.journalDAO.selectJournals('WHERE journals.id=$1', [ journal.id ])
        const entity = results.dictionary[journal.id]
        if (  ! entity ) {
            throw new ControllerError(500, 'server-error', `Journal(${journal.id}) does not exist after creation!`)
        } 

        // Update the session of all the members to include the new journal membership.
        for( const member of entity.members ) {
            const session = await this.sessionService.getSession(member.userId)
            if ( session ) {
                const userResults = await this.userDAO.selectUsers('WHERE users.id = $1', [ member.userId ])
                session.data.user = userResults.dictionary[member.userId]
                await this.sessionService.setSession(session)
            }
        }

        // ======== Notifications =============================================

        for ( const member of entity.members ) {
            await this.notificationService.createNotification(
                member.userId,
                'journal-member:invited',
                {
                    user: request.session.user,
                    journal: entity 
                }
            )
        }

        // ======== END Notifications =========================================
            
        const relations = await this.getRelations(results) 
        return response.status(201).json({ entity: results.dictionary[journal.id], relations: relations })
    }

    /**
     * GET /journal/:id
     *
     * Get details for a single journal in the database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getJournal(request, response) {
        const results = await this.journalDAO.selectJournals('WHERE journals.id=$1', [ request.params.id ])

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * No permissions checks - journal information is always public.
         * 
         * **********************************************************/

        if ( ! results.dictionary[request.params.id] ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${request.params.id}) not found.`)
        }

        const relations = await this.getRelations(results, request.query.relations)

        return response.status(200).json({ entity: results.dictionary[request.params.id], relations: relations })
    }

    /**
     * PUT /journal/:id
     *
     * @throws ControllerError NOT IMPLEMENTED
     */
    async putJournal(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to put a Journal, when PUT /journal/:id is unimplemented.`)
    }

    /**
     * PATCH /journal/:id
     *
     * Update details for the journal identified by `:id`
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchJournal(request, response) {
        const journal = request.body

        // We want to use the id in the route over any id sent in the body.
        journal.id = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 2. Journal(:id) must exist
         * 3. Authenticated user must be JournalUser with 'owner' permissions.
         *
         * Data validation:
         *
         * 4. Only name and description may be patched.
         * 
         * **********************************************************/

        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', `Unauthenticated user attempting to patch Journal(${journal.id}).`)
        }

        const user = request.session.user

        const existingJournal = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journal.id ])

        if ( existingJournal.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a Journal(${journal.id}) that doesn't exist!`)
        }

        const owningUser = existingJournal.dictionary[request.params.id].members.find((m) => m.userId == user.id && m.permissions == 'owner')
        if ( ! owningUser ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `User(${user.id}) attempted to patch a journal they do not own.`)
        }


        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the Journal.
         ********************************************************/

        await this.journalDAO.updatePartialJournal(journal)

        const results = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journal.id ])
        if ( ! results.dictionary[journal.id] ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journal.id}) after patching!`)
        }

        const relations = await this.getRelations(results) 
        return response.status(201).json({ entity: results.dictionary[journal.id], relations: relations })
    }

    /**
     * DELETE /journal/:id
     *
     * Delete the Journal identified by `:id`
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteJournal(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 2. Journal(:id) must exist
         * 3. Authenticated user must be JournalUser with 'owner' permissions.
         * 
         * **********************************************************/
        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', `Unauthenticated user attempting to patch Journal(${request.params.id}).`)
        }

        const user = request.session.user

        const existingJournals = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ request.params.id ])

        if ( existingJournals.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a Journal(${request.params.id}) that doesn't exist!`)
        }

        const existingJournal = existingJournals.dictionary[request.params.id]

        const owningUser = existingJournal.members.find((m) => m.userId == user.id && m.permissions == 'owner')
        if ( ! owningUser ) {
            throw new ControllerError(403, 'not-authorized:not-owner', 
                `User(${user.id}) attempted to patch a journal they do not own.`)
        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      PATCH the Journal.
         ********************************************************/

        await this.journalDAO.deleteJournal(existingJournal)

        return response.status(200).json({ entity: { id: request.params.id } })
    }

    // ======= Journal Members ================================================

    /**
     * GET /journal/:journalId/members
     *
     * @throws ControllerError NOT IMPLEMENTED
     */
    async getJournalMembers(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to call getJournalMembers which is not implemented.`)
    }

    /**
     * POST /journal/:journalId/members
     *
     * Add a User to a journal as a Member and assign them permissions.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postJournalMembers(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 2. Journal(:id) must exist
         * 3. Authenticated user must be JournalUser with 'owner' or 'editor' permissions.
         *
         * Data validation:
         *
         * 4. Only "owners" may add "editors" or "owners".
         * 
         * **********************************************************/
       
        const journalId = request.params.journalId

        /**
         * { 
         *      userId: int,
         *      permissions: ENUM('reviewer', 'editor', 'owner')
         * }
         */
        const member = request.body

        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempting to post Member to Journal(${journalId}).`)
        }
        const user = request.session.user

        // 2. Journal(:id) must exist
        const existingJournal = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journalId ])

        if ( existingJournal.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Attempt to POST a member to a Journal(${journalId}) that doesn't exist!`)
        }

        // 3. Authenticated user must be JournalUser with 'owner' or 'editor' permissions.
        const userMember = existingJournal.dictionary[journalId].members.find((m) => m.userId == user.id)
        if ( userMember.permissions !== 'owner' && userMember.permissions != 'editor' ) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${user.id}) attempted to add a user to a Journal(${journalId}) they do not have permissions for.`)
        }

        // 4. Only "owners" may add "editors" or "owners".
        if ( (member.permissions == 'editor' || member.permissions == 'owner') && userMember.permissions !== 'owner') {
            throw new ControllerError(403, 'not-authorized',
                `User(${user.id}) attempted to add an ${member.permissions} to Journal(${journalId}) when they are not an owner.`)
        }
        
        /********************************************************
         * Permissions Checks and Validation Complete
         *      POST the Journal.
         ********************************************************/
        
        await this.journalDAO.insertJournalMember(journalId, member)

        const results = await this.journalDAO.selectJournals(`WHERE journals.id = $1`, [ journalId ])
        const entity = results.dictionary[journalId]

        if ( ! results.dictionary[journalId] ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        // Update the session of all the members to include the new journal membership.
        const session = await this.sessionService.getSession(member.userId)
        if ( session ) {
            const userResults = await this.userDAO.selectUsers('WHERE users.id = $1', [ member.userId ])
            session.data.user = userResults.dictionary[member.userId]
            await this.sessionService.setSession(session)
        }

        // ======== Notifications =============================================

        await this.notificationService.createNotification(
            member.userId,
            'journal-member:invited',
            {
                user: request.session.user,
                journal: entity
            }
        )

        // ======== END Notifications =========================================

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.dictionary[journalId],
            relations: relations
        })
    }

    /**
     * GET /journal/:journalId/member/:userId
     *
     * @throws ControllerError NOT IMPLEMENTED
     */
    async getJournalMember(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to call getJournalMember which is not implemented.`)
    }

    /**
     * PUT /journal/:journalId/member/:userId
     *
     * @throws ControllerError NOT IMPLEMENTED
     */
    async putJournalMember(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to call putJournalMember which is not implemented.`)
    }

    /**
     * PATCH /journal/:journalId/member/:userId
     *
     * Update the membership of Journal(:journalId) for user User(:userId)
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchJournalMember(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. Patch must be included in request body.
         * 2. User is authenticated.
         * 3. Journal(:journalId) must exist
         * 4. Authenticated user must be a Member of Journal(:id).
         * 5. Target User(:userId) must be a member of Journal(:id).
         * 6. Authenticated user must be Owner of Journal(:id) to modify.
         * 
         * **********************************************************/
       
        const journalId = request.params.journalId
        const userId = request.params.userId

        // 1. Patch must be included in request body.
        const member = request.body 

        if ( ! member ) {
            throw new ControllerError(400, 'no-patch',
                `Attempt to patch a member of Journal(${journalId}) missing request body.`)
        }

        // Override the userId in the body with the one from the path.
        member.userId = userId

        // 2. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempting to patch Member of Journal(${journalId}).`)
        }

        // 3. Journal(:journalId) must exist
        const user = request.session.user

        const existingJournal = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journalId ])

        if ( existingJournal.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a member of a Journal(${journalId}) that doesn't exist!`)
        }

        // 4. Authenticated user must be a Member of Journal(:journalId).
        const userMember = existingJournal.dictionary[journalId].members.find((m) => m.userId == user.id)
        
        if ( ! userMember ) {
            throw new ControllerError(403, 'not-authorized',
                `Non-member User(${user.id}) attempted to delete User(${userId}) from membership of Journal(${journalId}).`)
        }

        // 5. Target User(:userId) must be a member of Journal(:journalId).
        const targetMember = existingJournal.dictionary[journalId].members.find((m) => m.userId == member.userId)

        if ( ! targetMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to delete non-member User(${userId}) from membership of Journal(${journalId}).`)
        }

        // 6. Authenticated user must be Owner of Journal(:journalId) to modify.
        //
        // Technically we could let Editors modify reviewers, but the only
        // thing they can modify are the permissions and Editors are not
        // allowed to promote reviewers to Editor or Owner.  So while we could
        // allow them to modify, practically there's nothing they could change.
        // And Reviewers aren't allowed to modify.  
        //
        // So we're just going to require Owner permissions to PATCH. 
        //
        // This is different from DELETE and POST, because Editors are allowed
        // to add and remove Reviewers.
        if ( userMember.permissions !== 'owner' ) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${user.id}) attempted to modify permissions of a member of Journal(${journalId}) by they were not an owner.`)
        }


        /********************************************************
         * Permissions Checks and Validation Complete
         *      POST the Journal.
         ********************************************************/

        await this.journalDAO.updateJournalMember(journalId, member)

        const results = await this.journalDAO.selectJournals(`WHERE journals.id = $1`, [ journalId ])

        if ( ! results.dictionary[journalId] ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        // Update the session of all the members to include the new journal membership.
        const session = await this.sessionService.getSession(member.userId)
        if ( session ) {
            const userResults = await this.userDAO.selectUsers('WHERE users.id = $1', [ member.userId ])
            session.data.user = userResults.dictionary[member.userId]
            await this.sessionService.setSession(session)
        }

        // TODO Notification: role-changed

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.dictionary[journalId],
            relations: relations
        })
    }

    /**
     * DELETE /journal/:journalId/member/:userId
     *
     * Delete the membership of Journal(:journalId) for User(:userId)
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the journal we wish to
     * retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteJournalMember(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is authenticated.
         * 2. Journal(:journalId) must exist
         * 3. Authenticated user must be a Member of Journal(:id).
         * 4. Target User(:userId) must be a member of Journal(:id).
         * 5a. If target User(:userId) is Reviewer, then Editor or Owner may delete.
         * 5b. If target User(:userId) is Editor or Owner, then only Owner may delete.
         *
         * Data validation:
         * 
         * **********************************************************/
       
        const journalId = request.params.journalId
        const userId = request.params.userId

        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempting to patch Member of Journal(${journalId}).`)
        }

        // 2. Journal(:journalId) must exist
        const user = request.session.user

        const existingJournal = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journalId ])

        if ( existingJournal.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Attempt to patch a member of a Journal(${journalId}) that doesn't exist!`)
        }

        // 3. Authenticated user must be a Member of Journal(:id).
        const userMember = existingJournal.dictionary[journalId].members.find((m) => m.userId == user.id)
        
        if ( ! userMember ) {
            throw new ControllerError(403, 'not-authorized',
                `Non-member User(${user.id}) attempted to delete User(${userId}) from membership of Journal(${journalId}).`)
        }

        // 4. Target User(:userId) must be a member of Journal(:id).
        const targetMember = existingJournal.dictionary[journalId].members.find((m) => m.userId == userId)

        if ( ! targetMember ) {
            throw new ControllerError(400, 'not-member',
                `User(${user.id}) attempted to delete non-member User(${userId}) from membership of Journal(${journalId}).`)
        }

        // 5a. If target User(:userId) is Reviewer, then Editor or Owner may delete.
        if ( targetMember.permissions == 'reviewer' && userMember.permissions !== 'owner' && userMember.permissions !== 'editor' ) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${user.id}) attempted to delete a member of a Journal(${journalId}) they do not have permissions for.`)
        }

        // 5b. If Target User(:userId) is Editor or Owner, then only Owner may delete.
        if ( (targetMember.permissions == 'editor' || targetMember.permissions == 'owner') && userMember.permissions !== 'owner') {
            throw new ControllerError(403, 'not-authorized', 
                `User(${user.id}) attempted to delete a member of a Journal(${journalId}) they do not have permissions for.`)
        }

        /********************************************************
         * Permissions Checks and Validation Complete
         *      POST the Journal.
         ********************************************************/

        await this.journalDAO.deleteJournalMember(journalId, userId)

        const results = await this.journalDAO.selectJournals(`WHERE journals.id = $1`, [ journalId ])
        const entity = results.dictionary[journalId]

        if ( ! results.dictionary[journalId] ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        // Update the session of all the members to include the new journal membership.
        const session = await this.sessionService.getSession(userId)
        if ( session ) {
            const userResults = await this.userDAO.selectUsers('WHERE users.id = $1', [ userId ])
            session.data.user = userResults.dictionary[userId]
            await this.sessionService.setSession(session)
        }

        // TODO Notification: removed.

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.dictionary[journalId],
            relations: relations
        })
    }
}
