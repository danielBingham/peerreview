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
         * 1. User is logged in.
         * 2. Logged in user must be JournalUser with 'owner' permissions.
         *
         * Data validation:
         *
         * 3. Journal has at least 1 valid user.
         * 
         * **********************************************************/

        // 1. User is logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `User must be authenticated to create a journal!`)
        }

        const user = request.session.user

        // 2. Logged in user must be JournalUser with 'owner' permissions.
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

    async putJournal(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to put a Journal, when PUT /journal/:id is unimplemented.`)
    }

    async patchJournal(request, response) {
        const journal = request.body

        // We want to use the id in the route over any id sent in the body.
        journal.id = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal(:id) must exist
         * 3. Logged in user must be JournalUser with 'owner' permissions.
         *
         * Data validation:
         *
         * 4. Only name and description may be patched.
         * 
         * **********************************************************/

        // 1. User must be logged in.
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


    async deleteJournal(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User is logged in.
         * 2. Journal(:id) must exist
         * 3. Logged in user must be JournalUser with 'owner' permissions.
         * 
         * **********************************************************/
        // 1. User must be logged in.
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

    async getJournalMembers(request, response) {

    }

    async postJournalMembers(request, response) {

    }

    async getJournalMember(request, response) {

    }

    async putJournalMember(request, response) {

    }

    async patchJournalMember(request, response) {

    }

    async deleteJournalMember(request, response) {

    }
}
