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
import fs from 'fs'

import { Core } from '@danielbingham/peerreview-core' 

export class FileService {
    core: Core
    base: string

    constructor(core: Core) {
        this.core = core

        this.base = '/public'
    }

    withBase(path: string): string {
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

    copyFile(currentPath: string, newPath: string): void {
        fs.copyFileSync(this.withBase(currentPath), this.withBase(newPath)) 
    }

    moveFile(currentPath: string, newPath: string): void {
        fs.copyFileSync(this.withBase(currentPath), this.withBase(newPath)) 
        fs.rmSync(this.withBase(currentPath))
    }

    removeFile(path: string): void {
        fs.rmSync(this.withBase(path))
    }

    readFile(path: string): Buffer {
        return fs.readFileSync(this.withBase(path))
    }
}
