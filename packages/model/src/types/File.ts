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
import { Model } from './Model'

export interface File extends Model {
    /** The User.id of the user who uploaded this file. */
    userId: number

    /** The location where this file is stored.  Probably an S3 bucket url. */
    location: string

    /** The file path to the file with in the location. */
    filepath: string

    /** The mimetype of this file.  */
    type: string

    /** Time/Date when the file was created. */
    createdDate: string

    /** Time/Date when the file was last updated. */
    updatedDate: string
}

export interface PartialFile {
    /** The database id of the file, a UUID. **/
    id?: string 

    /** The User.id of the user who uploaded this file. */
    userId?: number

    /** The location where this file is stored.  Probably an S3 bucket url. */
    location?: string

    /** The file path to the file with in the location. */
    filepath?: string

    /** The mimetype of this file.  */
    type?: string
}
