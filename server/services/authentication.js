const bcrypt = require('bcrypt');

module.exports = class AuthenticationService {

    constructor() {

    }

    /**
     * Returns a promise that will resolve with the completed hash.
     */
    hashPassword(password) {
        console.log('Attempting to hash: ' + password);
        return bcrypt.hash(password, 10);
    }

    /**
     * Returns a promise that will resolve with `true` or `false` depending on
     * whether they match.
     */
    checkPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

}
