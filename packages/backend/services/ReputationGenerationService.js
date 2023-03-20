/**
 * Reputation Service
 *
 * Methods to help calculate and manage reputation.
 */

const FieldDAO = require('../daos/FieldDAO')
const UserDAO = require('../daos/UserDAO')
const OpenAlexService = require('./OpenAlexService')

const ServiceError = require('../errors/ServiceError')

module.exports = class ReputationGenerationService {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fieldDAO = new FieldDAO(database, logger)
        this.userDAO = new UserDAO(database, logger)

        this.openAlexService = new OpenAlexService(logger)
    }


    /**
     * Completely recalculate the user's reputation.
     *
     * @param {int} userId  The id of the user we want to recalculate
     * reputation for.
     *
     * TODO Update this to account for initial reputation.
     */
    async recalculateReputation(userId) {
        // ======== Clear out the existing reputation =========================

        console.log(`Resetting reputation tables for ${userId}.`)
        // Reset reputation gained from papers.
        await this.database.query(`
            DELETE FROM user_paper_reputation WHERE user_id = $1
        `, [ userId ])

        // Reset reputation gained from reviews.
        await this.database.query(`
            DELETE FROM user_review_reputation WHERE user_id = $1
        `, [ userId ])

        // Reset reputation calculated in each field.
        await this.database.query(`
            DELETE FROM user_field_reputation WHERE user_id = $1
        `, [ userId ])


        // ======== Recalculate their reputation from the database ============
        const paperResults = await this.database.query(`
            SELECT papers.id as paper_id 
                FROM papers 
                LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id 
            WHERE paper_authors.user_id = $1
        `, [ userId ])

        console.log(`Calculating reputation for ${paperResults.rows.length} papers.`)
        for ( const row of paperResults.rows) {
            await this.recalculateUserReputationForPaper(userId, row.paper_id)
        }

        console.log(`Calculating Review Reputation for User(${userId}).`)
        await this.recalculateUserReviewReputation(userId)

        console.log(`Recalculating User's Total reputation.`)
        await this.recalculateReputationForUser(userId)

        // ======== Add initial field reputation back in ======================
        const initialFieldResults = await this.database.query(`
            SELECT field_id, reputation 
                FROM user_initial_field_reputation
            WHERE user_id = $1
        `, [ userId ])

        for (const row of initialFieldResults.rows) {
            const upsertResult = await this.database.query(`
                INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES($1, $2, $3)
                    ON CONFLICT (field_id, user_id) DO
                UPDATE SET reputation = user_field_reputation.reputation + $3
            `, [ row['field_id'], userId, row['reputation'] ])

            if ( upsertResult.rowCount == 0 ) {
                throw new Error(`Something went wrong in an attempt to upsert reputation for user ${userId} and ${row['field_id']}.`)
            }
        }
    }

    /**
     * Completely Recalculate a user's reputation for a single paper.  
     * 
     * @param {int} userId  The id of the user who's reputation we're calculating.
     * @param {int} paperId The id of the paper we're calculating reputation gained from.
     */
    async recalculateUserReputationForPaper(userId, paperId) {
        const scoreResults = await this.database.query(`
            SELECT SUM(vote) as "totalScore" from responses where paper_id = $1
        `, [ paperId ])

        if ( scoreResults.rows.length == 0) {
            return
        }

        const reputation = scoreResults.rows[0].totalScore * 10

        const paperInsertResults = await this.database.query(`
            INSERT INTO user_paper_reputation ( paper_id, user_id, reputation) VALUES ( $1, $2, $3) 
        `, [ paperId, userId, reputation ])

        if ( paperInsertResults.rowCount == 0) {
            throw new Error(`Failed to update user_paper_reputation for paper ${paperId}.`)
        }

        await this.recalculateUserReputationForPaperFields(userId, paperId, reputation)
    }


    /**
     * Recalculate a User's Reputation recieved from each field.  This table
     * doesn't play into the users total reputation count, rather it allows us
     * to quickly access how much reputation a user has earned in each
     * field.  
     *
     * @param {int} userId  The id of the user who's reputation we're calculating.
     * @param {int} paperId The id of the paper we're assessing reputation for.
     * @param {int} reputation  The total reputation the user gained from that paper.
     **/
    async recalculateUserReputationForPaperFields(userId, paperId, reputation) {
        const fieldResults = await this.database.query(`
            SELECT field_id from paper_fields where paper_id = $1
        `, [ paperId ])

        if ( fieldResults.rows.length == 0 ) {
            return 
        }
        const rootIds = fieldResults.rows.map((r) => r.field_id)

        const fieldIds = await this.fieldDAO.selectFieldAncestors(rootIds)
        const uniqueFieldIds = [ ...new Set(fieldIds) ]

        // Upsert the reputation into the fields table.
        for (const fieldId of uniqueFieldIds ) {
            const upsertResults = await this.database.query(`
                INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES($1, $2, $3)
                    ON CONFLICT (field_id, user_id) DO
                UPDATE SET reputation = user_field_reputation.reputation + $3
            `, [ fieldId, userId, reputation ])

            if ( upsertResults.rowCount == 0 ) {
                throw new Error(`Something went wrong in an attempt to upsert reputation for user ${userId} and ${fieldId}.`)
            }
        }
    }


    /**
     * Recalculate the reputation a user has gained from reviews on papers.
     *
     * @param {int} userId  The id of the user for which we'd like to calculate review reputation.
     */
    async recalculateUserReviewReputation(userId) {
        // Now get a list of papers and a count versions that earned
        // reputation.
        const reviewResults = await this.database.query(`
            SELECT paper_id as paperId, COUNT(DISTINCT(version)) FROM reviews WHERE reviews.user_id = $1 AND reviews.status = 'accepted' GROUP BY paper_id
        `, [ userId ])

        // Walk that list and insert rows into the user_review_reputation table
        // to account for the reputation gained.
        if ( reviewResults.rows.length > 0) {
            for ( const row of reviewResults.rows ) {
                const updateResults = await this.database.query(`
                    INSERT INTO user_review_reputation (user_id, paper_id, reputation) VALUES ($1, $2, $3)
                `, [ userId, row.paperId, row.count * 25 ])

                if ( updateResults.rowCount == 0 ) {
                    throw new Error(`Failed to insert review reputation for user ${userId} and paper ${row.paperId}!`)
                }

                // Make sure we include the review reputation in their fields.
                await this.recalculateUserReputationForPaperFields(userId, row.paperId, row.count*25)
            }
        }
    }

    /**
     *
     */
    async recalculateReputationForUser(userId) {
        // ======== Get total reputation gained from works. ===================

        const worksResults = await this.database.query(`
            SELECT SUM(reputation) as reputation FROM user_initial_works_reputation WHERE user_id = $1
        `, [ userId ])

        if ( worksResults.rows.length !== 1) {
            throw new Error('Works reputation query returned invalid results!')
        }
        const worksReputation = ( worksResults.rows[0].reputation ? worksResults.rows[0].reputation : 0)

        // ======== Get total reputation gained from papers. ==================

        const paperResults = await this.database.query(`
            SELECT SUM(reputation) as reputation FROM user_paper_reputation WHERE user_id = $1
        `, [ userId ])
    
        if ( paperResults.rows.length !== 1 ) {
            throw new Error('Paper reputation query returned invalid results!')
        }
        const paperReputation = ( paperResults.rows[0].reputation ? paperResults.rows[0].reputation : 0 )


        // ======== Get total reputation gained from reviews. =================
        
        const reviewResults = await this.database.query(`
            SELECT SUM(reputation) as reputation FROM user_review_reputation WHERE user_id = $1
        `, [ userId ])

        if ( reviewResults.rows.length !== 1) {
            throw new Error('Review reputation query returned invalid results!')
        }
        const reviewReputation = ( reviewResults.rows[0].reputation ? reviewResults.rows[0].reputation: 0 ) 

        // ======== Update User total reputation. =============================
        // Update the user's total reputation as the sum of reputation gained
        // from papers and reputation gained from reviews.
        
        const total = parseInt(worksReputation) + parseInt(paperReputation) + parseInt(reviewReputation)
        const userResults = await this.database.query(`
            UPDATE users 
                 SET reputation = $1 
            WHERE id = $2
        `, [ total, userId ] )

        if ( userResults.rowCount == 0) {
            throw new Error(`Attempt to recalculate reputation for user ${userId} failed!`)
        }
    }


    /**************************************************************************
     *  Reputation Incremental Calculations
     *
     *  Methods to add incremental reputation to a user for various events.
     *
     **************************************************************************/

    /**
     * Give a user incremental reputation in each of the fields attached to the
     * paper identified by `paperId` and each of their parents.  Don't give any
     * field more than 1x the reputation increment, so fields included
     * multiple times through parentage shouldn't get more than
     * `reputation`. 
     *
     * This is the gnarly one.  We approach it by identifying the full set of
     * fields including the tagged fields and their parents, and then selecting
     * only unique ids for that set.  Each unique field in the set then gets
     * incremented by `reputation`.
     *
     * @param {int} userId  The id of the `user` we're incrementing reputation for.
     * @param {int} paperId The id of the `paper` we're incrementing reputation for.
     * @param {int} reputation  The reputation increment.  Note, this is
     * reputation, *NOT* score.  This is score * 10 for paper votes. Can also
     * be used to give review reputation.
     *
     * @return {void}
     */
    async incrementUserReputationForPaperFields(userId, paperId, reputation) {

        // Get fields for the paper identified by `paperId`.
        const fieldResults = await this.database.query(`
            SELECT field_id from paper_fields where paper_id = $1
        `, [ paperId ])

        // Huh... paper doesn't have fields.  That's weird.
        if ( fieldResults.rows.length == 0 ) {
            return 
        }

        // These fields are the `root` fields.  We'll start there and climb the
        // field heirarchy to the tree's root (the top level fields).
        const rootIds = fieldResults.rows.map((r) => r.field_id)

        // Get all parents for the root fields.
        const fieldIds = await this.fieldDAO.selectFieldAncestors(rootIds)

        // Get only unique ids from the set of [rootIds, parentIds]
        const set = new Set(fieldIds)
        const uniqueFieldIds = [ ...set ]

        // Upsert the reputation into the fields table.
        for (const fieldId of uniqueFieldIds ) {
            const upsertResults = await this.database.query(`
                INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES($1, $2, $3)
                    ON CONFLICT (field_id, user_id) DO
                UPDATE SET reputation = user_field_reputation.reputation + $3
            `, [ fieldId, userId, reputation ])

            if ( upsertResults.rowCount == 0 ) {
                throw new Error(`Something went wrong in an attempt to upsert reputation for user ${userId} and ${fieldId}.`)
            }
        }
    }

    /**
     * Give the user identified by `userId` incremental reputation for the
     * paper identified by `paperId` and `score`.  One up vote is +1 score, one
     * downvote is -1 score.
     *
     * Only increment reputation for a single author.  Gives that author +10
     * reputation for each upvote (positive score) and -10 for each downvote
     * (negative score).  The net result is that they should get score*10
     * total reputation change.
     *
     * Also increments field reputation for that user in the fields the given
     * paper is tagged with and their parents.  Each field the paper is tagged
     * with should get an equivalent score change to the paper as a whole, but
     * fields that are both tagged on the paper and parents of the fields
     * tagged on the paper should only get one instance of the score change.
     * IE if the paper gets +10 score and is tagged with both 'physics' and
     * 'astrophysics', 'physics' should only increase +10, not +20.
     *
     * @param {int} userId  The id of the `user` we're incrementing reputation for.
     * @param {int} paperId The id of the `paper` we're incrementing reputation for.
     * @param {int} score   The score changing we're adding to this paper.
     *
     * @return {void}
     */
    async incrementUserReputationForPaper(userId, paperId, score) {
        const reputation = score*10

        const paperResults = await this.database.query(`
            INSERT INTO user_paper_reputation ( reputation, user_id, paper_id ) VALUES ( $1, $2, $3 )
                ON CONFLICT ( paper_id, user_id ) DO 
            UPDATE SET reputation = user_paper_reputation.reputation + $1
        `, [ reputation, userId, paperId ])

        if ( paperResults.rowCount == 0) {
            throw new Error(`Upsert failed to modify rows for paper: ${paperId} and user: ${userId}.`)
        }

        await this.incrementUserReputationForPaperFields(userId, paperId, reputation)    

        await this.recalculateReputationForUser(userId)
    }

    /**
     * Add incremental reputation for a paper to all of the authors who wrote
     * the paper.
     *
     * Each Author on the paper should get Score*10 reputation, where score is
     * the +/- increment we're adding.
     *
     * @param {int} paperId The id of the `paper` we wish to add reputation for.
     * @param {int} score   The score increment we're adding to the paper.  One
     * vote is one score.  Up votes are +1, down votes are -1.
     *
     * @return {void}
     */
    async incrementReputationForPaper(paperId, score) {
        const authorsResults = await this.database.query(`
            SELECT user_id from paper_authors WHERE paper_id = $1
        `, [ paperId ])

        if ( authorsResults.rows.length == 0) {
            throw new Error(`Something went wrong when fetching authors for paper ${paperId}.`)
        }

        for (const row of authorsResults.rows) {
            await this.incrementUserReputationForPaper(row.user_id, paperId, score)
        }
    }

    /**
     * Add incremental reputation for a single review to the user who wrote the review.
     *
     * If this is the first accepted review on this version of the paper, then
     * the user who wrote it should get 25 reputaiton.
     *
     * @param {Object} review   The `review` object.  @see server/daos/review.js
     *
     * @return {void}
     */
    async incrementReputationForReview(review) {
        if ( review.status !== 'accepted') {
            return
        }

        const reviewResults = await this.database.query(`
                SELECT id FROM reviews WHERE paper_id = $1 AND version = $2 AND user_id = $3 AND status='accepted'
             `, [ review.paperId, review.version, review.userId ])

        // You're only allowed to gain reputation from a single review on each
        // versions, so if there's one that already exists, we assume you've
        // gained reputation from it and bail.
        if ( reviewResults.rows.length !== 1 ) {
            return
        }

        const reviewReputationResults = await this.database.query(`
                INSERT INTO user_review_reputation (user_id, paper_id, reputation)
                    VALUES ($1, $2, $3)
                ON CONFLICT (user_id, paper_id) DO UPDATE
                    SET reputation = user_review_reputation.reputation + $3
            `, [ review.userId, review.paperId, 25 ])

        if ( reviewReputationResults.rowCount == 0) {
            throw new Error(`Failed to insert or update review reputation for review ${review.id}.`)
        }
        await this.incrementUserReputationForPaperFields(review.userId, review.paperId, 25)

        await this.recalculateReputationForUser(review.userId)
    }

    /**************************************************************************
     *  Reputation Initialization Calculations
     *
     *  Methods to add initial reputation to a user from Open Alex.
     *
     **************************************************************************/

    /**
     * Add a work to the `user_initial_works_reputation` table.  A work is Open
     * Alex's version of a "paper", but can include more than just published
     * papers.  We're using works as a rough analog for papers here and
     * citations as a rough analog for up votes in order to give users a base
     * starting reputation, so that they don't have to start from zero.
     *
     * Each work gets one row in the table along with the user its attached to
     * and the Reputation (citations*10) associated with it.
     *
     * @param {int} userId      The `user.id` of the Peer Review user.
     * @param {string} workId   The work.id from the Open Alex Work record: https://docs.openalex.org/about-the-data/work
     *
     * @return {void}
     */
    async incrementInitialUserReputationForWork(userId, workId, reputation) {
        const paperResults = await this.database.query(`
            INSERT INTO user_initial_works_reputation (user_id, works_id, reputation) VALUES ($1, $2, $3)
                ON CONFLICT (works_id, user_id) DO
            UPDATE SET reputation = user_initial_works_reputation.reputation + $3
        `, [ userId, workId, reputation])

        if ( paperResults.rowCount == 0 ) {
            throw new Error(`Upsert failed to modify rows for work: ${workId} and user: ${userId}.`)
        }
    }

    /**
     * Add a reputation increment to the initial reputation for a user in each
     * of the fields passed.  Assumes the array of fields passed as
     * `fieldNames` represents an group of fields that a single paper was
     * tagged with, and the reputation passed represents the reputation gained
     * for that paper.
     *
     * Updates the `user_initial_field_reputation` table to record the reputation
     * gained in each of the fields passed and each of their parents.
     *
     * @param {int} userId  The id of the user we're giving reputation.
     * @param {string[]} fieldNames An array of fieldNames the user will be
     * given reputation in.
     * @param {int} reputation  The reputation increment we'll add to the given
     * fields and their parents.
     */
    async incrementInitialUserReputationForFields(userId, fieldNames, reputation) {
        // Get field ids from the array of field names.
        const fieldResults = await this.database.query(`
            SELECT fields.id FROM fields WHERE fields.name = ANY($1::text[])
        `, [ fieldNames ])

        if ( fieldResults.rows.length == 0 ) {
            return 
        }

        // Get the root ids from the results of the name query.  The root ids
        // in this case refers to the root of our search up the field tree.
        const rootIds = fieldResults.rows.map((r) => r.id)

        // Select the full set of field ids we're going to be working with: our
        // root ids and all of their parents.
        const fieldIds = await this.fieldDAO.selectFieldAncestors(rootIds)

        // Get only unique ids from the set of [rootIds, parentIds]
        const set = new Set(fieldIds)
        const uniqueFieldIds = [ ...set ]

        // Upsert the reputation into the initial fields reputation table.
        for (const fieldId of uniqueFieldIds ) {
            const upsertResults = await this.database.query(`
                INSERT INTO user_initial_field_reputation (field_id, user_id, reputation) VALUES($1, $2, $3)
                    ON CONFLICT (field_id, user_id) DO
                UPDATE SET reputation = user_initial_field_reputation.reputation + $3
            `, [ fieldId, userId, reputation ])

            if ( upsertResults.rowCount == 0 ) {
                throw new Error(`Something went wrong in an attempt to upsert reputation for user ${userId} and ${fieldId}.`)
            }

            const upsertFieldResults = await this.database.query(`
                INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES($1, $2, $3)
                    ON CONFLICT (field_id, user_id) DO
                UPDATE SET reputation = user_field_reputation.reputation + $3
            `, [ fieldId, userId, reputation ])

            if ( upsertFieldResults.rowCount == 0 ) {
                throw new Error(`Something went wrong in an attempt to upsert reputation for user ${userId} and ${fieldId}.`)
            }
        }
    }

    /**
     * Take a list of processed works generated by
     * `getPapersFor{OrcidId|OpenAlexId}` and give the user identified by
     * `userId` initial reputation.  Idempotent - resets the user's initial
     * reputation before generating their new inital reputation.
     *
     * @param {int} userId  The id of the user we're giving reputation.
     * @param {Object[]} works  An array of work objects generated by getPapersFor{OrcidId|OpenAlexId}.
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {void}
     */
    async initializeReputationForUserWithWorks(userId, works, job) {
        // Before we initialize them, clear out the initial reputation tables.
        // This makes this Idempotent.
        console.log('Clearing initial reputation tables.') 
        await this.database.query(`
            DELETE FROM user_initial_field_reputation WHERE user_id = $1
        `, [ userId ])

        await this.database.query(`
            DELETE FROM user_initial_works_reputation WHERE user_id = $1
        `, [ userId ])

        console.log(`Processing ${works.length} works.`)
        if ( job ) {
            job.progress({ step: 'works-reputation', stepDescription: `Generating reputation for works...`, progress: 0 })
        }

        let count = 0
        for ( const work of works) {
            await this.incrementInitialUserReputationForWork(userId, work.workId, work.citations*10)
            count += 1

            if ( job ) {
                job.progress({ step: 'works-reputation', stepDescription: `Generating reputation for works...`, progress: parseInt((count/works.length)*100) })
            }
        } 

        console.log(`Recalculating reputation.`)
        if ( job ) {
            job.progress({ step: 'recalculate-reputation', stepDescription: `Recalculating user's total reputation...`, progress: 0 })
        }
        await this.recalculateReputation(userId)
        if ( job ) {
            job.progress({ step: 'recalculate-reputation', stepDescription: `Recalculating user's total reputation...`, progress: 100 })
        }

        // This has no impact on the user's total reputation, so we can do it after we call `recalculateReputation`.
        //
        // We need to do it after we call `recalculateReputation` because it
        // increments the value of `user_field_reputation` for each initial
        // field.  This is to save us a query down the line.
        //
        // So we need to call `recalculateReputation` first so that it can wipe
        // and then regenerate `user_field_reputation` based on their Peer
        // Review papers and reviews.  Then we call this with those already
        // zeroed out.
        console.log(`Calculating field reputation for ${works.length} works.`) 
        if ( job ) {
            job.progress({ step: 'calculate-field-reputation', stepDescription: `Calculating user's reputation in fields...`, progress: 0 })
        }
        count = 0
        for ( const work of works) {
            await this.incrementInitialUserReputationForFields(userId, work.fields, work.citations*10)
            count += 1
            if ( job ) {
                job.progress({ step: 'calculate-field-reputation', stepDescription: `Calculating user's reputation in fields...`, progress: parseInt((count/works.length)*100) })
            }
        } 

    }

    /**
     * Set the initial reputation for a user by querying OpenAlex for their works and giving them 
     * reputation in each field we have that matches the concepts the work is tagged with.  The 
     * reputation given is works.citations * 10.
     *
     * Basically, we query OpenAlex for their works, citations, and concepts
     * and treat each concept as a field and each citation as an upvote.
     *
     * @param {int} userId  The id of the user who's reputation we wish to initialize.
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {void}
     */
    async initializeReputationForUser(userId, job) {
        if ( job ) {
            job.progress({ step: 'find-orcid', stepDescription: `Retrieving user's ORCID iD...`, progress: 0 })
        }

        const users = await this.userDAO.selectUsers('WHERE users.id = $1', [ userId ])
        const user = users[0]

        if ( ! user.orcidId ) {
            throw new ServiceError('no-orcid', `Cannot initialize reputation for a user(${userId}) with out a connected ORCID iD.`)
        }

        if ( job ) {
            job.progress({ step: 'find-orcid', stepDescription: `Retrieving user's ORCID iD...`, progress: 100 })
        }

        await this.initializeReputationForUserWithOrcidId(user.id, user.orcidId, job)
    }

    /**
     * Set the initial reputation for a user using their ORCID iD to match them
     * to their Open Alex record.
     *
     * @param {int} userId     Their Peer Review user.id.
     * @param {string} orcidId  Their ORCID iD.
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {void}
     */
    async initializeReputationForUserWithOrcidId(userId, orcidId, job) {
        const works = await this.openAlexService.getPapersForOrcidId(orcidId, job)
        await this.initializeReputationForUserWithWorks(userId, works, job)
    }

    /**
     * Set the initial reputation for a user using their Open Alex Id to match
     * them to their Open Alex record.
     *
     * @param {int} userId     Their Peer Review user.id.
     * @param {string} openAlexId   Their Open Alex Id.
     *
     * @return {void}
     */
    async initializeReputationForUserWithOpenAlexId(userId, openAlexId) {
        const works = await this.openAlexService.getPapersForOpenAlexId(openAlexId)
        await this.initializeReputationForUserWithWorks(userId, works)
    }

}
