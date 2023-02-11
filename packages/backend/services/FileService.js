const fs = require('fs')

module.exports = class FileService {

    constructor(logger) {
        this.base = '/public'
    }

    withBase(path) {
        // public/...
        if ( path.substring(0, this.base.length-1) == this.base.substring(1)) {
            return process.cwd() + '/' + path
        // We need to add /public to the front
        } else if ( path.substring(0, this.base.length) !== this.base) { 
            return process.cwd() + this.base + path
        // /public, we don't need to do anything
        } else {
            return process.cwd() + path
        }
    }

    copyFile(currentPath, newPath) {
        fs.copyFileSync(this.withBase(currentPath), this.withBase(newPath)) 
    }

    moveFile(currentPath, newPath) {
        fs.copyFileSync(this.withBase(currentPath), this.withBase(newPath)) 
        fs.rmSync(this.withBase(currentPath))
    }

    removeFile(path) {
        fs.rmSync(this.withBase(path))
    }

    readFile(path) {
        return fs.readFileSync(this.withBase(path))
    }
}
