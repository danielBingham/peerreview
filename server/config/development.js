/**************************************************************************************************
 *          Development Configuration
 *
 * This config works with our `development` deployments on minikube.
 **************************************************************************************************/

module.exports = {
    // Database configuration
    database: {
        host: 'peer-review-database-service',
        port: 5432,
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
