module.exports = class ServiceError extends Error {
    constructor(type, message) {
        super(message)

        this.type = type
    }
}
