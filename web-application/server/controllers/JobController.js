const backend = require('@danielbingham/peerreview-backend')

const BullQueue = require('bull')

module.exports = class JobController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.queue = new BullQueue('peer-review')

    }

    async getJobs(request, response) {

        // TODO Permissions checking.  Only allow users to see their own jobs.
        //
        
        const jobs = await this.queue.getJobs(['active'])
        return response.status(200).json(jobs)
    }

    async getJob(request, response) {
        const jobId = request.params.id

        // TODO Permissions checking.  Only allow users to see their own jobs.
        
        const job = await this.queue.getJob(jobId)
        return response.status(200).json(job.toJSON())
    }

    async postJob(request, response) {
        const name = request.body.name
       
        let job = null 
        if ( name == 'initialize-reputation' ) {
            job = await this.initializeReputation(request, response)
        } else {
            throw new ControllerError(400, 'invalid-job',
                `Attempt to trigger invalid job '${name}'.`)
        }

        return response.status(200).json(job.toJSON())
    }

    async patchJob(request, response) {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for pausing and resuming of jobs.
    }

    async deleteJob(request, response) {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for canceling of jobs.

    }

    // ================  JOBS ==========================

    async initializeReputation(request, response) {
        const userId = request.body.data.userId

        // Validation: 1. :user_id must be set.
        if ( ! userId ) {
            throw new ControllerError(400, 'userId-is-required', `User attempted to initialize reputation with out a user_id.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to initialize reputation for User(${userId}).`)
        }

        // Permissions: 2. User must be initializing their own reputation.
        // Users may only initialize their own reputation.  We'll add admins
        // who can initialize other users reputation later.
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized:wrong-user',
                `User(${request.session.user.id}) attempted to initialize reputation for User(${userId}).`)
        }


        const job = await this.queue.add('initialize-reputation', { userId: userId })
        return job
    }

}
