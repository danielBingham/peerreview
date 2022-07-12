module.exports = class ControllerError extends Error {
    constructor(status, type, message) {
        super(message)

        this.status = status
        this.type = type
    }
}
