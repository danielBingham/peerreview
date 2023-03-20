/**************************************************************************************************
 *          Default Configuration
 *
 * This is a default configuration file with dummy or null values to lay out the structure of the 
 * configuration file.
 *
 **************************************************************************************************/

module.exports = {
    backend: '/api/v0/',
    // Database configuration
    database: {
        host: null,
        user: null,
        password: null,
        name: null
    },
    session: {
        key: null,
        secret: null,
        secure_cookie: null
    },
    spaces: {
        endpoint: null,
        bucket_url: null,
        access_id: null,
        access_key: null,
        bucket: null
    },
    orcid: {
        authorization_host: null,
        api_host: null,
        client_id: null,
        client_secret: null,
        authentication_redirect_uri: null,
        connect_redirect_uri: null
    },
    log_level: "info"
};
