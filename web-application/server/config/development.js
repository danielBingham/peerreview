/**************************************************************************************************
 *          Development Configuration
 *
 * This config works with our `development` deployments on minikube.
 **************************************************************************************************/

module.exports = {
    host: 'https://localhost:8080/',
    backend: '/api/0.0.0',
    // Database configuration
    database: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: 'peer_review' 
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT 
    },
    session: {
        key: 'peer_review_id',
        secret: process.env.SESSION_SECRET,
        secure_cookie: false
    },
    s3: {
        bucket_url: 'https://peer-review-development-storage.s3.amazonaws.com',
        bucket: 'peer-review-development-storage',
        access_id: process.env.S3_ACCESS_ID,
        access_key: process.env.S3_ACCESS_KEY
    },
    orcid: {
        authorization_host: 'https://sandbox.orcid.org',
        api_host: 'https://pub.sandbox.orcid.org',
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        authentication_redirect_uri: 'https://localhost:8080/orcid/authentication',
        connect_redirect_uri: 'https://localhost:8080/orcid/connect'
    },
    postmark: {
        api_token: process.env.POSTMARK_API_TOKEN
    },
    log_level: 'debug'
};
