/**************************************************************************************************
 *          Staging Configuration
 *
 * This is the configuration for the `staging` environment on Digital Ocean.
 *
 **************************************************************************************************/

module.exports = {
    host: 'https://peer-review.io/',
    backend: '/api/0.0.0',
    // Database configuration
    database: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: 'peer_review'
    },
    session: {
        key: 'peer_review_id',
        secret: process.env.SESSION_SECRET,
        secure_cookie: true
    },
    s3: {
        bucket_url: 'https://peer-review-production-storage.s3.amazonaws.com/',
        bucket: 'peer-review-production-storage',
        access_id: process.env.S3_ACCESS_ID,
        access_key: process.env.S3_ACCESS_KEY
    },
    orcid: {
        authorization_host: 'https://orcid.org',
        api_host: 'https://pub.orcid.org',
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        authentication_redirect_uri: 'https://peer-review.io/orcid/authentication',
        connect_redirect_uri: 'https://peer-review.io/orcid/connect'
    },
    postmark: {
        api_token: process.env.POSTMARK_API_TOKEN
    },
    log_level: 'info'
};