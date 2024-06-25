/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

/**
 * A wrapper around `console.log` and `console.error` that respects our
 * configuration values allowing us to control our logging output.
 */
export class Logger  {
    level: number
    id: string

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

    static levelDescriptions = [
        'error',
        'warn',
        'info',
        'http',
        'verbose',
        'debug',
        'silly'
    ]

    /**
     * Build the logger with a target log level set.  Any message "more
     * important", with a lower number, than the target log level will be
     * logged.  Any message that's "less important", higher number, will be
     * ignored.
     *
     * @param {number|string} level     The target log level.
     */
    constructor(level: number|string) {
        this.level = Logger.levels.error

        if (typeof level == 'number') {
            this.level = level
        } else if ( Number.isInteger(level) ) {
            this.level = parseInt(level)
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

    /**
     * Set a unique id that identifies the session for the logger.  This allows
     * us to potentially connect log output and errors to individual users. Can
     * be very helpful for working with users to reproduce and debug their
     * issues.
     *
     * @param {string} id    The string id we want to use to identify this
     * session in logs.
     *
     * @return {void}
     */
    setId(id: string): void {
        this.id = id
    }

    /**
     *
     */
    log(level: number, message: any): void {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        const now = new Date()
        let logPrefix = `${now.toISOString()}:Session(${this.id}):${Logger.levelDescriptions[level]}:: `
        if ( typeof message === 'object' ) {
            if ( level == Logger.levels.error) {
                console.log(logPrefix + 'Error encountered.') 
                console.error(message)
            } else {
                console.log(logPrefix + 'Logging object.')
                console.log(message)
            }
        } else {
            if ( level == Logger.levels.error) {
                console.log(logPrefix + 'Error encountered.') 
                console.error( message)
            } else {
                console.log(logPrefix + message)
            }
        }
    }

    /**
     * Log an error.
     */
    error(message: any): void {
        this.log(Logger.levels.error, message)    
    }

    /**
     * Log a warning.
     */
    warn(message: any): void {
        if ( message instanceof Error ) {
            const content = `Warning: ${message.message}`
            this.log(Logger.levels.warn, content)
        } else {
            this.log(Logger.levels.warn, message)
        }
    }

    /**
     * Log some info.
     */
    info(message: any): void {
        this.log(Logger.levels.info, message)
    }

    /**
     * Log http query info.
     */
    http(message: any): void {
        this.log(Logger.levels.http, message)
    }

    /**
     * Log a verbose message.
     */
    verbose(message: any): void {
        this.log(Logger.levels.verbose, message)
    }

    /**
     * Log a debug message.
     */
    debug(message: any): void {
        this.log(Logger.levels.debug, message)
    }

    /**
     * Log a silly message.
     */
    silly(message: any): void {
        this.log(Logger.levels.silly, message)
    }

}
