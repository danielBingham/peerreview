/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

import * as fs from 'fs'

import { Pool } from 'pg'
import { Queue } from 'bullmq'
import { ServerClient } from 'postmark'


import { Logger } from './Logger'
import { FeatureFlags } from './FeatureFlags'
import { Session } from './Session'


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
    queue?: Queue
    features?: FeatureFlags
    session?: Session
}

/***
 * A wrapper around our core dependencies that will be used by most of our
 * services and controllers.
 */
export class Core {

    /**
     * The name of the context in which we are using the core. One of
     * 'web-application' or 'worker'.
     */
    contextName: string

    /**
     * An instance of Logger that we'll use to write to the logs.
     */
    logger: Logger

    /**
     * An instance of the Session handler allowing the session to be updated
     * or destroyed.  It's methods will need to be replaced in middleware with
     * closures that allow access to `request.session`.
     */
    session: Session

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
    queue: Queue 

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

        this.logger.info(`Initializing session handler...`)
        if ( overrides && overrides.session ) {
            this.session = overrides.session
        } else {
            this.session = new Session()
        }

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
    initializeQueue(): Queue {
        return new Queue('peer-review', { connection: this.config.redis })
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
