/******************************************************************************
 * JournalController
 *
 * Restful routes for manipulating journals.
 *
 ******************************************************************************/

const { JournalDAO, DAOError } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class JournalController {

    constructor(core) {
        this.core = core

        this.journalDAO = new JournalDAO(this.core)
    }

    /**
     * GET /journals
     *
     * Get a list of journals. 
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body Must be a valid `journal` object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getJournals(request, response) {
        const { dictionary, list } = await this.journalDAO.selectJournals()
        return response.status(200).json(list)
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
                await journalTransactionDAO.insertJournalMember(journal, member)
            }
           
            await client.query(`COMMIT`)
        } catch (error ) {
            await client.query(`ROLLBACK`)
            throw error
        } finally {
            client.release()
        }

        const { dictionary, list } = await this.journalDAO.selectJournals('WHERE journals.id=$1', [ journal.id ])
        if ( list.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Journal(${journal.id}) does not exist after creation!`)
        } else {
            return response.status(201).json(dictionary[journal.id])
        }
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
        const { dictionary, list } = await this.journalDAO.selectJournals('WHERE journals.id=$1', [ request.params.id ])

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * No permissions checks - journal information is always public.
         * 
         * **********************************************************/

        if ( list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Journal(${request.params.id}) not found.`)
        }

        return response.status(200).json(dictionary[request.params.id])
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

        const returnJournal  = await this.journalDAO.selectJournals('WHERE journals.id = $1', [ journal.id ])
        if ( returnJournal.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journal.id}) after patching!`)
        }

        return response.status(200).json(returnJournal.dictionary[journal.id])
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

        return response.status(200).send()
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

        // 2. Journal(:id) must exist
        const user = request.session.user

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

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        return response.status(200).json(results.dictionary[journalId])
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

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        return response.status(200).json(results.dictionary[journalId])
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

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find Journal(${journalID}) after adding new member.`)
        }

        return response.status(200).json(results.dictionary[journalId])
    }
}
