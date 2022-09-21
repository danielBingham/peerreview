module.exports = class ControllerError extends Error {
    constructor(status, type, message, data) {
        super(message)

        this.status = status
        this.type = type

        // Optional
        this.data = {} 
        if ( data ) {
            this.data = data
        }
    }
}
