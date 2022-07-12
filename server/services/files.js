const fs = require('fs')

module.exports = class FileService {

    constructor(logger) {
        this.base = 'public'
    }

    withBase(path) {
        if ( path.substring(0, this.base.length) !== this.base) { 
            return this.base + path
        } else {
            return path
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
}
