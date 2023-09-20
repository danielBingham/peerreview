const { Client, Pool } = require('pg')
const BullQueue = require('bull')
const Postmark = require('postmark')

const Logger = require('./logger')

/***
 * A wrapper around our core dependencies that will be used by most of our
 * services and controllers.
 */
module.exports = class Core {

    constructor(context, config) {

        /**
         * The context in which we are running the core. One of
         * 'web-application' or 'worker'.
         */
        this.context = context

        /**
         * An instance of backend.Logger that we'll use to write to the logs.
         */
        this.logger = null

        /**
         * An instance of pg.Pool that we'll use to interact with the Postgres
         * database.
         */
        this.database = null

        /**
         * An instance of of a bull queue that we'll use to queue up long
         * running jobs for pickup by the workers.
         */
        this.queue = null

        /**
         * Our Postmark server client for sending emails to using the Postmark
         * API.
         */
        this.postmarkClient = null

        /**
         * Our configuration values.  
         *
         * @see web-application/server/config/index.js
         * @see worker/config/index.js
         */
        this.config = config 

        /**
         * An instance of FeatureFlags, initialized with information on what
         * feature flags are set for the current user.
         *
         * This is initialized separately from the other core dependencies.
         */
        this.features = null

        this.shutdownInProgress = false

    }

    /**
     * Initialize the common dependencies.
     */
    initialize() {

        /**********************************************************************
         * Logger Initialization
         **********************************************************************/
        this.logger = new Logger(this.config.log_level)
        this.logger.info(`Starting ${this.config.environment} ${this.context}...`)

        /**********************************************************************
         * Database Connection Initialization
         **********************************************************************/
        const databaseConfig = {
            host: this.config.database.host,
            user: this.config.database.user,
            password: this.config.database.password,
            database: this.config.database.name,
            port: this.config.database.port 
        }

        if ( this.config.database.certificate ) {
            databaseConfig.ssl = {
                rejectUnauthorized: false,
                cert: fs.readFileSync(this.config.database.certificate).toString()
            }
        }

        this.logger.info(`Connecting to postgres database at ${databaseConfig.host}:${databaseConfig.port} with ${databaseConfig.user}.`)
        this.database = new Pool(databaseConfig)

        /**********************************************************************
         * Bull Queue Initialization
         **********************************************************************/
        this.logger.info(`Connecting to redis ${this.config.redis.host}:${this.config.redis.port}.`)

        // TECHDEBT - Are we even using this?
        this.queue = new BullQueue('peer-review', { redis: this.config.redis })

        this.postmarkClient = new Postmark.ServerClient(this.config.postmark.api_token)
    }

    async shutdown() {
        if ( this.shutdownInProgress ) {
            this.logger.info('Shutdown called again while already in progress.')
            console.error(new Error('Shutdown called a second time.'))
            return
        }
        this.logger.info('Beginning shutdown of core dependencies...')
        this.shutdownInProgress = true

        this.logger.info('Closing the connection pool.')
        await this.database.end()
        this.database = null
        this.logger.info('Connection pool closed.')

        this.logger.info('Closing the redis queue connection.')
        await this.queue.close()
        this.queue = null
        this.logger.info('Redis queue closed.')
    }
}
