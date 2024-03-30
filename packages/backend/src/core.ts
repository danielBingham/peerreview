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

/**
 * An object containing overrides for the core.  Can be used to create a core
 * object with one of the dependencies overriden and defined differently from
 * how the passed config would dictate.  Can also be used to mock one or more of
 * the dependencies.
 */
export interface CoreOverrides {
    logger?: Logger
    database?: Pool
    postmarkClient?: ServerClient
    queue?: Bull.Queue<any>
    features?: FeatureFlags
}

/***
 * A wrapper around our core dependencies that will be used by most of our
 * services and controllers.
 */
export default class Core {

    /**
     * The name of the context in which we are using the core. One of
     * 'web-application' or 'worker'.
     */
    contextName: string

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

    /**
     * Our Bull worker queue.  Used to starting and managing background jobs.
     */
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
    features: FeatureFlags 

    /**
     * Are we in the process of shutting down the server?
     */
    shutdownInProgress: boolean

    /**
     * Build our Core object.
     *
     * @param {string} contextName The name of the context this core will be
     * used in.  One of 'web-application' or 'worker'.
     * @param {any} config The configuration data needed to initialize the core.
     * @param {CoreOverrides} overrides (Optional) Instances of the
     * dependencies the core wraps that can be used to override those which
     * would normally be instantiated using the configuration. @see Interface CoreOverrides
     */
    constructor(contextName: string, config: any, overrides?: CoreOverrides) {

        this.contextName = contextName

        this.config = config 

        if ( overrides && overrides.logger) {
            this.logger = overrides.logger
        } else {
            this.logger = this.initializeLogger()
        }

        this.logger.info(`Starting ${this.config.environment} ${this.contextName}...`)

        this.logger.info(`Connecting to postgres database at ${this.config.database.host}:${this.config.database.port} with ${this.config.database.user}.`)
        if ( overrides && overrides.database) {
            this.database = overrides.database
        } else {
            this.database = this.initializeDatabase()
        }

        this.logger.info(`Initializing Postmark client.`)
        if ( overrides && overrides.postmarkClient) {
            this.postmarkClient = overrides.postmarkClient
        } else {
            this.postmarkClient = this.initializePostmark()
        }

        this.logger.info(`Initializing Queue with redis connection ${this.config.redis.host}:${this.config.redis.port}.`)
        if ( overrides && overrides.queue) {
            this.queue = overrides.queue
        } else {
            this.queue = this.initializeQueue() 
        }

        this.logger.info(`Initializing feature flags.`)
        if ( overrides && overrides.features ) {
            this.features = overrides.features
        } else {
            this.features = this.initializeFeatureFlags() 
        }

        this.shutdownInProgress = false
    }

    /**
     * Initialize our logger instance.
     */
    initializeLogger(): Logger {
        return new Logger(this.config.log_level)
    }

    /**
     * Initialize our database pool connection.
     */
    initializeDatabase(): Pool {
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

        return new Pool(databaseConfig)
    }

    /**
     * Initialize our Postmark client, used for sending email.
     */
    initializePostmark(): ServerClient {
        return new ServerClient(this.config.postmark.api_token)
    }

    /**
     * Initialize our queue server for background jobs.
     */
    initializeQueue(): Bull.Queue<any> {
        return new Queue('peer-review', { redis: this.config.redis })
    }


    /**
     * Initialize our feature flag record.
     */
    initializeFeatureFlags(): FeatureFlags {
        return new FeatureFlags()
    }

    /**
     * Shut down the application and gracefully close any open connections.
     */
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
