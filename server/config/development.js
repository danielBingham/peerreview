/**************************************************************************************************
 *          Development Configuration
 *
 * This configuration file assumes we're doing development testing in Dockerland.  It assumes the
 * mysql database is being run from one docker container and the express server is being run in
 * another, that is also serving the built / compiled react code.  They talk to each other over the
 * docker bridge network.
 *
 **************************************************************************************************/

module.exports = {
    // Database configuration
    database: {
        host: '172.17.0.2',
        user: 'app',
        password: 'local-development',
        name: 'peer_review' 
    },
    session: {
        key: 'peer_review_id',
        secret: 'development' 
    },
    log_level: 'debug'
};
