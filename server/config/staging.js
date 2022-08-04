/**************************************************************************************************
 *          Staging Configuration
 *
 * This is the configuration for the `staging` environment on Digital Ocean.
 *
 **************************************************************************************************/

module.exports = {
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
    log_level: 'debug'
};
