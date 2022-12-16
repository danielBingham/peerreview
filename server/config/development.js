/**************************************************************************************************
 *          Development Configuration
 *
 * This config works with our `development` deployments on minikube.
 **************************************************************************************************/

module.exports = {
    backend: '/api/0.0.0',
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
        secret: 'development',
        secure_cookie: false
    },
    spaces: {
        endpoint: 'https://nyc3.digitaloceanspaces.com',
        bucket_url: 'https://peer-review-development-files.nyc3.digitaloceanspaces.com/',
        access_id: process.env.SPACES_ACCESS_ID,
        access_key: process.env.SPACES_ACCESS_KEY,
        bucket: 'peer-review-development-files'
    },
    orcid: {
        authorization_host: 'https://sandbox.orcid.org',
        api_host: 'https://pub.sandbox.orcid.org',
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        authentication_redirect_uri: 'https://localhost:3000/orcid/authentication',
        connect_redirect_uri: 'https://localhost:3000/orcid/connect'
    },
    log_level: 'debug'
};
