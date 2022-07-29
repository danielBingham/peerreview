/**************************************************************************************************
 *      Peer Review -- API Backend Server
 *
 * Provides the API backend for the Peer Review website.  Implements a RESTful API.  Runs as a
 * stateless node server, with state pushed out to either a Redis instance or a MySQL database.
 *
 **************************************************************************************************/

var express = require('express')
var path = require('path')
var morgan = require('morgan')
var debug = require('debug')('peer-review:server')
var { Client, Pool } = require('pg')
var session = require('express-session')
var pgSession = require('connect-pg-simple')(session)
const Uuid = require('uuid')

const Logger = require('./logger')
const ControllerError = require('./errors/ControllerError')

// Load our configuration file.  Loads the index.js file from the config/ directory which
// then uses the NODE_ENV variable to determine what environment we're running in and
// load the appropriate configuration.  Configuration is a Javascript object containing
// the configuration values.
//
// For sturcture, see config/default.js
var config = require('./config')

const logger = new Logger(config.log_level)

const connection = new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port 
})

// Load express.
var app = express()

// Use a development http logger.
app.use(morgan('dev'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

let sessionStore = new pgSession({
    pool: connection,
    createTableIfMissing: true
})
app.use(session({
    key: config.session.key,
    secret: config.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        path: '/',
        httpOnly: true,
        secure: false,
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
const router = require('./router')(connection, logger, config)

// Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
// in the future, we want to release an updated version of the api, we can load it at
// ``/api/v1/`` and so on, with out impacting the old versions of the router.
app.use('/api/0.0.0/', router)

// Javascript files go to dist.
app.get(/.*\.(css|js)$/, function(request, response) {
    debug('request.originalUrl: ' + request.originalUrl)
    const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
    debug('Generated path: ' + filepath)
    response.sendFile(filepath)
})

// Requests for static files.
app.get(/.*\.(svg|pdf|jpg|png)$/, function(request, response) {
    debug('request.originalUrl: ' + request.originalUrl)
    const filepath = path.join(process.cwd(), 'public', request.originalUrl)
    debug('Generated path: ' + filepath)
    response.sendFile(filepath)
})

// Everything else goes to the index file.
app.use('*', function(request,response) {
    debug('request.originalUrl: ' + request.originalUrl)
    const filepath = path.join(process.cwd(), 'public/dist/index.html')
    debug('Generated path: ' + filepath)
    response.sendFile(filepath)
})

// error handler
app.use(function(error, request, response, next) {
    try {
        // Log the error.
        logger.error(error)

        if ( error instanceof ControllerError) {
            return response.status(error.status).json({ error: error.type })
        } else { 
            return response.status(500).json({ error: 'server-error' })
        }
    } catch (secondError) {
        // If we fucked up something in our error handling.
        logger.error(secondError)
        response.status(500).json({error: 'server-error'})
    }
})

module.exports = app
