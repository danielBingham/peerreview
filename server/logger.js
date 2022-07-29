
module.exports = class Logger  {
    /**
     * Use NPM's logging levels.
     */
    static levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
    }

    constructor(level) {
        if (Number.isInteger(level)) {
            this.level = level
        } else {
            if (level == 'error') {
                this.level = Logger.levels.error
            } else if (level == 'warn') {
                this.level = Logger.levels.warn
            } else if (level == 'info') {
                this.level = Logger.levels.info
            } else if (level == 'http') {
                this.level = Logger.levels.http
            } else if (level == 'verbose') {
                this.level = Logger.levels.verbose
            } else if (level == 'debug') {
                this.level = Logger.levels.debug
            } else if (level == 'silly') {
                this.level = Logger.levels.silly
            }
        }
        this.id = 'unknown' 
    }

    setId(id) {
        this.id = id
    }

    log(level, message) {
        const now = Date()
        const logPrefix = `${now}:${this.id}:: `
        if ( level <= this.level ) {
            if ( level == Logger.levels.error) {
                console.log(logPrefix + 'Error encountered.') 
                console.error( message)
            } else {
                console.log(logPrefix + message)
            }
        } 
    }

    error(message) {
        this.log(Logger.levels.error, message)    
    }

    warn(message) {
        this.log(Logger.levels.warn, message)
    }

    info(message) {
        this.log(Logger.levels.info, message)
    }

    http(message) {
        this.log(Logger.levels.http, message)
    }

    verbose(message) {
        this.log(Logger.levels.verbose, message)
    }

    debug(message) {
        this.log(Logger.levels.debug, message)
    }

    silly(message) {
        this.log(Logger.levels.silly, message)
    }

}
