/**************************************************************************************************
 *      Hot Development Configuration
 *
 * This configuration file is used for hot development when running nodemon and the react
 * development server locally.  In this set up, both react and express are running on the host
 * machine, rather than in docker, and the mysql is running in a docker container bound to
 * localhost:3306.  So we need to point the database configuration at localhost.
 *
 **************************************************************************************************/
// We only use this for hotdev.  We have other ways of getting the environment
// variables set properly in other contexts.
require('dotenv').config()

module.exports = {
    backend: '/api/0.0.0',
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
        redirect_uri: 'https://localhost:3000/orcid/authentication'
    },
    log_level: 'debug'

};
