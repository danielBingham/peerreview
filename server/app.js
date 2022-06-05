/**************************************************************************************************
 *      Peer Review -- API Backend Server
 *
 * Provides the API backend for the Peer Review website.  Implements a RESTful API.  Runs as a
 * stateless node server, with state pushed out to either a Redis instance or a MySQL database.
 *
 **************************************************************************************************/

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var { Client, Pool } = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

const Logger = requre('./logger');

// Load our configuration file.  Loads the index.js file from the config/ directory which
// then uses the NODE_ENV variable to determine what environment we're running in and
// load the appropriate configuration.  Configuration is a Javascript object containing
// the configuration values.
//
// For sturcture, see config/default.js
var config = require('./config');

const logger = new Logger(config.log_level)

const connection = new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: 5432
});

// Load express.
var app = express();

// Setup a view engine, we'll use Handlebars (http://handlebarsjs.com/)
//
// @TODO Since this is just a RESTful API server, we don't actually need any views.  However,
// express crashes when you don't set some sort of view engine.  I didn't feel like debugging it
// so it's here.
//
// And actually looking a little more closely, that crash might be because we render an error view
// down below in the error handler.  I'll sort it out later.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Use a development logger.
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let sessionStore = new pgSession({
    pool: connection,
    createTableIfMissing: true
});
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
        maxAge: 1000 * 60 * 60 * 24 } // One 24 hour period.
}));

// Get the api router, pre-wired up to the controllers.
const router = require('./router')(connection, logger, config);

// Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
// in the future, we want to release an updated version of the api, we can load it at
// ``/api/v1/`` and so on, with out impacting the old versions of the router.
app.use('/api/0.0.0/', router);

app.use('*', function(req,res) {
    res.sendFile(path.join(__dirname+'/dist/index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
    // Log the error.
    console.log(err);


    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
