import config from './configuration'

/**
 * Use NPM's logging levels.
 */
export const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
}


export class Logger  {
    /**
     * Convenience property to allow easy access to the levels.
     */
    static levels = levels


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
            console.log(message)
        }
    }

    error(message) {
        this.log(levels.error, message)    
    }

    warn(message) {
        this.log(levels.warn, message)
    }

    info(message) {
        this.log(levels.info, message)
    }

    http(message) {
        this.log(levels.http, message)
    }

    verbose(message) {
        this.log(levels.verbose, message)
    }

    debug(message) {
        this.log(levels.debug, message)
    }

    silly(message) {
        this.log(levels.silly, message)
    }

}

export default new Logger(config.log_level)
