/**************************************************************************************************
 *      Hot Development Configuration
 *
 * This configuration file is used for hot development when running nodemon and the react
 * development server locally.  In this set up, both react and express are running on the host
 * machine, rather than in docker, and the mysql is running in a docker container bound to
 * localhost:3306.  So we need to point the database configuration at localhost.
 *
 **************************************************************************************************/

module.exports = {
    // Database configuration
    database: {
        host: 'localhost',
        port: 5432,
        user: 'app',
        password: 'local-development',
        name: 'peer_review' 
    },
    session: {
        key: 'peer_review_id',
        secret: 'hot-dev' 
    },
    log_level: 'debug'

};
