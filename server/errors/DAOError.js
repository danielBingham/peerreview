module.exports = class DAOError extends Error {
    constructor(type, message) {
        super(message)

        this.type = type
    }
}
