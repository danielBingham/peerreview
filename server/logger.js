
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
                this.level = levels.error
            } else if (level == 'warn') {
                this.level = levels.warn
            } else if (level == 'info') {
                this.level = levels.info
            } else if (level == 'http') {
                this.level = levels.http
            } else if (level == 'verbose') {
                this.level = levels.verbose
            } else if (level == 'debug') {
                this.level = levels.debug
            } else if (level == 'silly') {
                this.level = levels.silly
            }
        }
    }

    log(level, message) {
        if ( level <= this.level ) {
            if ( level == Logger.levels.error) {
                console.error(message)
            } else {
                console.log(message)
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
