const BullQueue = require('bull')

const { Client, Pool } = require('pg')

const { Core, ReputationGenerationService, ServiceError } = require('@danielbingham/peerreview-backend')

const config = require('./config')

const core = new Core('worker', config)
core.initialize()

const reputationGenerationService = new ReputationGenerationService(core)
core.logger.info(`Initializing 'initialize-reputation' job.`)

core.queue.process('initialize-reputation', async function(job, done) {
    core.logger.setId(`Reputation job: ${job.id}`)
    core.logger.debug(`Beginning job 'reputation-initialization' for user ${job.data.userId}.`)

    const result = {
        error: null
    }

    job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

    try {
        await reputationGenerationService.initializeReputationForUser(job.data.userId, job)
    } catch (error) {
        if ( error instanceof ServiceError) {
            // Validation: 2. User must have an ORCID iD attached to their record.
            // We checked this in ReputationGenerationService::initializeReputationForUser()
            if (error.type == 'no-orcid') {
                result.error = 'no-orcid'
            } else if ( error.type == 'request-failed' ) {
                result.error = 'server-error:api-connection'
            } else if ( error.type == 'no-author' ) {
                result.error = 'no-openalex-record'
            } else if ( error.type == 'multiple-authors' ) {
                result.error = 'multiple-openalex-record'
            }  else {
                result.error = 'unknown-error'
                core.logger.error(error)
            }
        } else {
            result.error = 'unknown-error'
            core.logger.error(error)
        }
    }

    job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

    core.logger.debug(`Finished job 'reputation-initialization' for user ${job.data.userId}.`)
    done(null, result)
})

core.logger.info('Initialized and listening...')

const shutdown = async function() {
    core.logger.info('Attempting a graceful shutdown...')
    await core.shutdown() 
    process.exit(0)
}

// We've gotten the termination signal, attempt a graceful shutdown.
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
