import fs from 'fs'

import { Pool } from 'pg'
import { ServerClient } from 'postmark'

// TECHDEBT: from here: https://github.com/OptimalBits/bull/issues/1772
import _Queue from 'bull'
import type Bull from 'bull/index.d'

import Logger from './logger'
import FeatureFlags from './features'

// TECHDEBT What the fucking shit Typescript+Bull.
// From here: https://github.com/OptimalBits/bull/issues/1772
const Queue = _Queue as typeof Bull

/***
 * A wrapper around our core dependencies that will be used by most of our
 * services and controllers.
 */
export default class Core {

    /**
     * The context in which we are running the core. One of
     * 'web-application' or 'worker'.
     */
    context: string

    /**
     * An instance of backend.Logger that we'll use to write to the logs.
     */
    logger: Logger

    /**
     * An instance of pg.Pool that we'll use to interact with the Postgres
     * database.
     */
    database: Pool 

    /**
     * Our Postmark server client for sending emails to using the Postmark
     * API.
     */
    postmarkClient: ServerClient 

    queue: Bull.Queue<any> 

    /**
     * Our configuration values.  
     *
     * @see web-application/server/config/index.js
     * @see worker/config/index.js
     */
    config: any

    /**
     * An instance of FeatureFlags, initialized with information on what
     * feature flags are set for the current user.
     *
     * This is initialized separately from the other core dependencies.
     */
    features: FeatureFlags | null

    /**
     * Are we in the process of shutting down the server?
     */
    shutdownInProgress: boolean

    constructor(context: string, config: any) {

        this.context = context

        this.config = config 

        /**********************************************************************
         * Logger Initialization
         **********************************************************************/
        this.logger = new Logger(this.config.log_level)
        this.logger.info(`Starting ${this.config.environment} ${this.context}...`)

        /**********************************************************************
         * Database Connection Initialization
         **********************************************************************/
        const databaseConfig: any = {
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

        this.postmarkClient = new ServerClient(this.config.postmark.api_token)

        /**********************************************************************
         * Bull Queue Initialization
         **********************************************************************/
        this.logger.info(`Connecting to redis ${this.config.redis.host}:${this.config.redis.port}.`)

        // TECHDEBT - Are we even using this?
        this.queue = new Queue('peer-review', { redis: this.config.redis })

        this.features = null

        this.shutdownInProgress = false

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
        this.logger.info('Connection pool closed.')
    }
}
