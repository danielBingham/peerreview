const backend = require('@danielbingham/peerreview-backend')

const BullQueue = require('bull')

const ControllerError = require('../errors/ControllerError')

module.exports = class JobController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.queue = new BullQueue('peer-review')

    }

    async getJobs(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own jobs (or must be admin).
         * 
         * ********************************************************************/
        
        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted retrieve jobs.`)
        }

        const jobs = {
            waiting: [],
            active: [],
            completed: []
        }
        
        jobs.waiting = await this.queue.getJobs(['waiting'])
        jobs.active = await this.queue.getJobs(['active'])
        jobs.completed = await this.queue.getJobs(['completed'])

        if ( request.session.user.permissions == 'admin' || request.session.user.permissions == 'superadmin') {
            return response.status(200).json(jobs)
        }

        let returnJobs = {
            waiting: [],
            active: [],
            completed: []
        }

        for ( const job of jobs.waiting ) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.waiting.push(job)
            }
        }

        for ( const job of jobs.active) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.active.push(job)
            }
        }

        for ( const job of jobs.completed) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.completed.push(job)
            }
        }

        return response.status(200).json(returnJobs)
    }

    async getJob(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own job (or must be admin).
         *
         * Validation:
         *
         * 1. :id must be set.
         * 
         * ********************************************************************/

        const jobId = request.params.id

        // Validation: 1. :id must be set
        if ( ! jobId ) {
            throw new ControllerError(400, 'id-missing',
                `Attempt to get job, but missing jobId.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to get Job(${jobId}).`)
        }
        
        const job = await this.queue.getJob(jobId)

        // 2. User may only get their own job (or must be admin).
        if ( job.data.session.user.id !== request.session.user.id && request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempted to access Job(${jobId}) which they did not trigger.`)
        }


        return response.status(200).json(job.toJSON())
    }

    async postJob(request, response) {
        const name = request.body.name

        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         *
         * Validation:
         *
         * 1. body.name must be set and be a valid job.
         * 
         * ********************************************************************/
       
        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to initialize reputation for User(${userId}).`)
        }

        let job = null 
        if ( name == 'initialize-reputation' ) {
            job = await this.initializeReputation(request, response)
        } 

        // Validation: 1. body.name must be set and be a valid job.
        else {
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

        // If we already have a reputation initialization job in progress for
        // this user, then return that job.
        const jobs = await this.queue.getJobs(['active'])
        for ( const job of jobs ) {
            if ( job.name == 'initialize-reputation' && job.data.userId == userId ) {
                return job
            }
        }

        const job = await this.queue.add('initialize-reputation', { session: { user: { id: request.session.user.id } }, userId: userId })
        return job
    }

}
