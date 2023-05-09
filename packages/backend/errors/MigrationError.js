module.exports = class MigrationError extends Error {
    constructor(status, message) {
        super(message)

        this.status = status
    }
}
