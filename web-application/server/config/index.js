/**************************************************************************************************
 *          Configuration
 *
 * Our configuration file.  Depending on environment variables to get the
 * proper configuration set.
 *
 **************************************************************************************************/

if ( process.env.NODE_ENV == 'development' ) {
    require('dotenv').config()
}

module.exports = {
    host: process.env.HOST,
    environment: process.env.NODE_ENV,
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
        bucket_url: process.env.S3_BUCKET_URL,
        bucket: process.env.S3_BUCKET,
        access_id: process.env.S3_ACCESS_ID,
        access_key: process.env.S3_ACCESS_KEY
    },
    orcid: {
        authorization_host: process.env.ORCID_AUTHORIZATION_HOST,
        api_host: process.env.ORCID_API_HOST,
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        authentication_redirect_uri: process.env.ORCID_AUTHENTICATION_REDIRECT_URI,
        connect_redirect_uri: process.env.ORCID_CONNECT_REDIRECT_URI 
    },
    postmark: {
        api_token: process.env.POSTMARK_API_TOKEN
    },
    log_level: process.env.LOG_LEVEL 
};