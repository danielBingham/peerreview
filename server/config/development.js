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
    spaces: {
        endpoint: 'https://nyc3.digitaloceanspaces.com',
        bucket_url: 'https://peer-review-development-files.nyc3.digitaloceanspaces.com/',
        access_id: process.env.SPACES_ACCESS_ID,
        access_key: process.env.SPACES_ACCESS_KEY,
        bucket: 'peer-review-development-files'
    },
    log_level: 'debug'
};
