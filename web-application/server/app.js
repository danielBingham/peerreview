/**************************************************************************************************
 *      Peer Review -- API Backend Server
 *
 * Provides the API backend for the Peer Review website.  Implements a RESTful API.  Runs as a
 * stateless node server, with state pushed out to either a Redis instance or a MySQL database.
 *
 **************************************************************************************************/

const express = require('express')
const session = require('express-session')
const cors = require('cors')

const morgan = require('morgan')
const debug = require('debug')('peer-review:server')

const { Client, Pool } = require('pg')
const pgSession = require('connect-pg-simple')(session)

const BullQueue = require('bull')

const path = require('path')
const fs = require('fs')
const Uuid = require('uuid')
const Handlebars = require('handlebars')

// Load our configuration file.  Loads the index.js file from the config/ directory which
// then uses the NODE_ENV variable to determine what environment we're running in and
// load the appropriate configuration.  Configuration is a Javascript object containing
// the configuration values.
//
// For sturcture, see config/default.js
const config = require('./config')

const backend = require('@danielbingham/peerreview-backend')
const ControllerError = require('./errors/ControllerError')

const logger = new backend.Logger(config.log_level)

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

logger.info(`Connecting to postgres database at ${databaseConfig.host}:${databaseConfig.port} with ${databaseConfig.user}.`)
const connection = new Pool(databaseConfig)

logger.info(`Connecting to redis ${config.redis.host}:${config.redis.port}.`)
const queue = new BullQueue('peer-review', { redis: config.redis })

// Load express.
const app = express()

if ( config.environment == 'development' ) {
    const webpack = require('webpack')
    const webpackMiddleware = require('webpack-dev-middleware')
    const webpackConfig = require('./webpack.config')

    const compiler = webpack(webpackConfig)
    app.use('/dist/', webpackMiddleware(compiler, {}))
}

app.use(cors({
    origin: config.s3.bucket_url,
    methods: [ 'GET' ]
}))

// Use a development http logger.
app.use(morgan('dev'))


// Make sure the request limit is large so that we don't run into it.
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: false }))

// Set up our session storage.  We're going to use database backed sessions to
// maintain a stateless app.
logger.info('Setting up the database backed session store.')
const sessionStore = new pgSession({
    pool: connection,
    createTableIfMissing: true
})
app.use(session({
    key: config.session.key,
    secret: config.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: { 
        path: '/',
        httpOnly: true,
        // TODO TECHDEBT Issue #143  
        //secure: true,
        //secure: config.session.secure_cookie,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // One 24 hour period.

    } 
}))

// Set the id the logger will use to identify the session.  We don't want to
// use the actual session id, since that value is considered sensitive.  So
// instead we'll just use a uuid.
app.use(function(request, response, next) {
    if ( request.session.user ) {
        logger.setId(request.session.user.id)
    } else {
        if ( request.session.logId ) {
            logger.setId(request.session.logId)
        } else {
            request.session.logId = Uuid.v4()
            logger.setId(request.session.logId)
        }
    }
    next()
})

// Get the api router, pre-wired up to the controllers.
const router = require('./router')(connection, queue, logger, config)

// Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
// in the future, we want to release an updated version of the api, we can load it at
// ``/api/v1/`` and so on, with out impacting the old versions of the router.
console.log(process.env.MAINTENANCE_MODE)
if( process.env?.MAINTENANCE_MODE === 'true' ) {
    console.log("maintenance-mode.")
    app.use(config.backend, function(request, response) {
        response.json({
            maintenance_mode: true
        })
    })
} else {
    app.use(config.backend, router)
}

app.get('/health', function(request, response) {
    console.log('health probe')
    response.status(200).send()
})

/**
 * Send configuration information up to the front-end.  Be *very careful*
 * about what goes in here.
 */
app.get('/config', function(request, response) {
    response.status(200).json({
        backend: config.backend, 
        environment: process.env.NODE_ENV,
        log_level: config.log_level,
        maintenance_mode: process.env.MAINTENANCE_MODE === 'true' ? true : false,
        orcid: {
            authorization_host: config.orcid.authorization_host,
            client_id: config.orcid.client_id,
            authentication_redirect_uri: config.orcid.authentication_redirect_uri,
            connect_redirect_uri: config.orcid.connect_redirect_uri

        }
    })
})

// Javascript files go to dist.
app.get(/.*\.(css|js|js.map)$/, function(request, response) {
    logger.debug('request.originalUrl: ' + request.originalUrl)
    const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
    logger.debug('Generated path: ' + filepath)
    response.sendFile(filepath)
})

// Requests for static files.
app.get(/.*\.(svg|pdf|jpg|png)$/, function(request, response) {
    logger.debug('request.originalUrl: ' + request.originalUrl)
    const filepath = path.join(process.cwd(), 'public', request.originalUrl)
    logger.debug('Generated path: ' + filepath)
    response.sendFile(filepath)
})

// Everything else goes to the index file.
app.use('*', function(request,response) {
    logger.debug('request.originalUrl: ' + request.originalUrl)

    const metadata = {
        url: config.host,
        applicationName: "Peer Review",
        title: "Peer Review (beta) - A Universal PrePrint+ Platform",
        description: "Peer Review is an experimental scholarly publishing platform. It enables crowdsourced peer review and public dissemination of scientific and academic papers.  It is open source and diamond open access.",
        image: `${config.host}img/how-it-works/review-example-2.png`,
        twitterHandle: "@peerreviewio",
        type: "website"
    }

    const filepath = path.join(process.cwd(), 'public/dist/index.html')
    const rawTemplate = fs.readFileSync(filepath, 'utf8')
    const template = Handlebars.compile(rawTemplate)
    const parsedTemplate = template(metadata)
    response.send(parsedTemplate)
})

// error handler
app.use(function(error, request, response, next) {
    try {
        // Log the error.
        if ( error instanceof ControllerError ) {
            if ( error.status < 500 ) {
                logger.warn(error)
            } else {
                logger.error(error)
            }
        } else {
            logger.error(error)
        }

        if ( error instanceof ControllerError) {
            return response.status(error.status).json({ 
                error: error.type, 
                data: error.data
            })
        } else { 
            return response.status(500).json({ error: 'server-error' })
        }
    } catch (secondError) {
        // If we fucked up something in our error handling.
        logger.error(secondError)
        response.status(500).json({error: 'server-error'})
    }
})

const shutdown = async function() {
    logger.info('Closing the connection pool.')
    await connection.end()
    logger.info('Connection pool closed.')

    logger.info('Closing the redis queue connection.')
    await queue.close()
    logger.info('Redis queue closed.')
}

module.exports = { 
    app: app,
    shutdown: shutdown
}
