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

const { Core, FeatureService, ServerSideRenderingService, PageMetadataService } = require('@danielbingham/peerreview-backend')
const ControllerError = require('./errors/ControllerError')

/**********************************************************************
 * Load Configuration
 **********************************************************************/
const config = require('./config') 

const core = new Core('web-application', config)
core.initialize()

// Load express.
const app = express()

app.use(cors({
    origin: core.config.s3.bucket_url,
    methods: [ 'GET' ]
}))

// Use a development http logger.
app.use(morgan('dev'))

// Make sure the request limit is large so that we don't run into it.
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: false }))

// Set up our session storage.  We're going to use database backed sessions to
// maintain a stateless app.
core.logger.info('Setting up the database backed session store.')
const sessionStore = new pgSession({
    pool: core.database,
    createTableIfMissing: true
})
app.use(session({
    key: core.config.session.key,
    secret: core.config.session.secret,
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
        core.logger.setId(request.session.user.id)
    } else {
        if ( request.session.logId ) {
            core.logger.setId(request.session.logId)
        } else {
            request.session.logId = Uuid.v4()
            core.logger.setId(request.session.logId)
        }
    }
    next()
})

app.use(function(request, response, next) {
    // initialize the settings
    if ( ! request.session.settings ) {
        request.session.settings = null 
    }
    next()
})


const FeatureFlags = require('./features')
// Setup FeatureFlags and make it available through the core.
app.use(function(request, response, next) {
    const featureService = new FeatureService(core)
    featureService.getEnabledFeatures().then(function(features) {
        core.features = new FeatureFlags(features)
        next()
    }).catch(function(error) {
        next(error)
    })
})

// Get the api router, pre-wired up to the controllers.
const router = require('./router')(core)

// Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
// in the future, we want to release an updated version of the api, we can load it at
// ``/api/v1/`` and so on, with out impacting the old versions of the router.
if( process.env?.MAINTENANCE_MODE === 'true' ) {
    core.logger.info('Entering maintenance mode.')

    app.use(core.config.backend, function(request, response) {
        response.json({
            maintenance_mode: true
        })
    })
} else {
    core.logger.info(`Configuring the API Backend on path '${core.config.backend}'`)

    app.use(core.config.backend, router)
}

app.get('/health', function(request, response) {
    response.status(200).send()
})

/**
 * Send configuration information up to the front-end.  Be *very careful*
 * about what goes in here.
 */
app.get('/config', function(request, response) {
    response.status(200).json({
        backend: core.config.backend, 
        environment: process.env.NODE_ENV,
        log_level: core.config.log_level,
        maintenance_mode: process.env.MAINTENANCE_MODE === 'true' ? true : false,
        orcid: {
            authorization_host: core.config.orcid.authorization_host,
            client_id: core.config.orcid.client_id,
            authentication_redirect_uri: core.config.orcid.authentication_redirect_uri,
            connect_redirect_uri: core.config.orcid.connect_redirect_uri
        }
    })
})

/**
 * A route to get the hash of enabled features.
 */
app.get('/features', function(request, response) {
    response.status(200).json(core.features.features)
})

/**
 * Handle requests for static image and pdf files.  We'll send these directly
 * to the public path.
 */
app.get(/.*\.(svg|pdf|jpg|png)$/, function(request, response) {
    const filepath = path.join(process.cwd(), 'public', request.originalUrl)
    response.sendFile(filepath)
})


/**
 * For javascript files and the index file we need to use different logic on
 * development and production.
 *
 * On development, we're going to use the webpack-dev-middleware to generate
 * the assets on the fly.  For production, we render the assets generated by
 * the webpack build from the `/dist` directory.
 *
 * For the index.html template, we need to run it through our server side 
 * rendering logic to populate the <head> with the page metadata.  We'll
 * do this for both development and production.
 *
 * TECHDEBT the webpack-dev-middleware server side rendering logic is
 * experimental, it may break on us in future versions.
 */
const serverSideRenderingService = new ServerSideRenderingService(core)
const pageMetadataService = new PageMetadataService(core)
if ( core.config.environment == 'development' ) {
    const webpack = require('webpack')
    const webpackMiddleware = require('webpack-dev-middleware')
    const webpackConfig = require('../webpack.config')

    webpackConfig.mode = 'development'

    const compiler = webpack(webpackConfig)
    app.use(webpackMiddleware(compiler, { 
        publicPath: webpackConfig.output.publicPath,
        serverSideRender: true,
        index: false
    }))

    app.use(function(request, response) {
        core.logger.debug(`Index File Request with webpack-dev-middleware server side rendering.`)
        const { devMiddleware } = response.locals.webpack
        const { assetsByChunkName, outputPath } = devMiddleware.stats.toJson() 
     
        const metadata = pageMetadataService.getRootWithDevAssets(assetsByChunkName)
        const parsedTemplate = serverSideRenderingService.renderIndexTemplate(metadata) 
        response.send(parsedTemplate)
    })
} else {

    // Javascript files go to dist.
    app.get(/.*\.(css|js|js.map)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
        response.sendFile(filepath)
    })

    // Everything else goes to the index file.
    app.use('*', function(request,response) {
        const metadata = pageMetadataService.getRoot()
        const parsedTemplate = serverSideRenderingService.renderIndexTemplate(metadata) 
        response.send(parsedTemplate)
    })
}

// error handler
app.use(function(error, request, response, next) {
    try {
        // Log the error.
        if ( error instanceof ControllerError ) {
            if ( error.status < 500 ) {
                core.logger.warn(error)
            } else {
                core.logger.error(error)
            }
        } else {
            core.logger.error(error)
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
        core.logger.error(secondError)
        response.status(500).json({error: 'server-error'})
    }
})

module.exports = { 
    app: app,
    core: core
}
