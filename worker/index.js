const BullQueue = require('bull')

const { Client, Pool } = require('pg')

const backend = require('@danielbingham/peerreview-backend')

// Load our configuration file.  Loads the index.js file from the config/ directory which
// then uses the NODE_ENV variable to determine what environment we're running in and
// load the appropriate configuration.  Configuration is a Javascript object containing
// the configuration values.
//
// For sturcture, see config/default.js
const config = require('./config')

const logger = new backend.Logger(config.log_level)
logger.setId('Worker')
logger.info(`Starting up as ${process.env.NODE_ENV}...`)
logger.debug(`Using debug logging.`)

const databaseConfig = {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port 
}

if ( config.database.certificate ) {
    databaseConfig.ssl = {
        rejectUnauthorized: false,
        cert: fs.readFileSync(config.database.certificate).toString()
    }
}

const connection = new Pool(databaseConfig)

logger.debug(`Connecting to redis ${config.redis.host}:${config.redis.port}.`)
const queue = new BullQueue('peer-review', { redis: config.redis }) 

const reputationGenerationService = new backend.ReputationGenerationService(connection, logger)
logger.info(`Initializing 'initialize-reputation' job.`)
queue.process('initialize-reputation', async function(job, done) {
    logger.setId(`Reputation job: ${job.id}`)
    logger.debug(`Beginning job 'reputation-initialization' for user ${job.data.userId}.`)

    const result = {
        error: null
    }

    job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

    try {
        await reputationGenerationService.initializeReputationForUser(job.data.userId, job)
    } catch (error) {
        if ( error instanceof backend.ServiceError) {
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
                logger.error(error)
            }
        } else {
            result.error = 'unknown-error'
            logger.error(error)
        }
    }

    job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

    logger.debug(`Finished job 'reputation-initialization' for user ${job.data.userId}.`)
    done(null, result)
})

logger.info('Initialized and listening...')
