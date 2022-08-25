/**
 * Use NPM's logging levels.
 */
export const LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    HTTP: 3,
    VERBOSE: 4,
    DEBUG: 5,
    SILLY: 6
}


export class Logger  {
    constructor(level) {
        this.setLevel(level)
    }

    setLevel(level) {
        if (Number.isInteger(level)) {
            this.level = level
        } else {
            if (level == 'error') {
                this.level = LEVELS.ERROR
            } else if (level == 'warn') {
                this.level = LEVELS.WARN
            } else if (level == 'info') {
                this.level = LEVELS.INFO
            } else if (level == 'http') {
                this.level = LEVELS.HTTP
            } else if (level == 'verbose') {
                this.level = LEVELS.VERBOSE
            } else if (level == 'debug') {
                this.level = LEVELS.DEBUG
            } else if (level == 'silly') {
                this.level = LEVELS.SILLY
            }
        }
    }

    log(level, message) {
        if ( level <= this.level ) {
            if ( level == LEVELS.ERROR) {
                console.error(message)
            } else {
                console.log(message)
            }
        } 
    }

    error(message) {
        this.log(LEVELS.ERROR, message)    
    }

    warn(message) {
        this.log(LEVELS.WARN, message)
    }

    info(message) {
        this.log(LEVELS.INFO, message)
    }

    http(message) {
        this.log(LEVELS.HTTP, message)
    }

    verbose(message) {
        this.log(LEVELS.VERBOSE, message)
    }

    debug(message) {
        this.log(LEVELS.DEBUG, message)
    }

    silly(message) {
        this.log(LEVELS.SILLY, message)
    }
}

const logger = new Logger('error')
export default logger

