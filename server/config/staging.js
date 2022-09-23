/**************************************************************************************************
 *          Staging Configuration
 *
 * This is the configuration for the `staging` environment on Digital Ocean.
 *
 **************************************************************************************************/

module.exports = {
    backend: '/api/0.0.0',
    // Database configuration
    database: {
        host: 'peer-review-database-do-user-4811995-0.b.db.ondigitalocean.com',
        port: 25060,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: 'peer_review',
        certificate: '/etc/certificates/ca-certificate.crt'
    },
    session: {
        key: 'peer_review_id',
        secret: process.env.SESSION_SECRET 
    },
    spaces: {
        endpoint: 'https://nyc3.digitaloceanspaces.com',
        bucket_url: 'https://peer-review-staging-files.nyc3.digitaloceanspaces.com/',
        access_id: process.env.SPACES_ACCESS_ID,
        access_key: process.env.SPACES_ACCESS_KEY,
        bucket: 'peer-review-staging-files'
    },
    orcid: {
        authorization_host: 'https://sandbox.orcid.org',
        api_host: 'https://pub.sandbox.orcid.org',
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        authentication_redirect_uri: 'https://staging.peer-review.io/orcid/authentication',
        connect_redirect_uri: 'https://staging.peer-review.io/orcid/connect'
    },
    postmark: {
        api_token: process.env.POSTMARK_API_TOKEN
    },
    log_level: 'debug'
};
