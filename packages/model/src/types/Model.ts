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
export enum Entities {
    Field = "Field",
    File = "File",
    Journal = "Journal",
    JournalSubmission = "JournalSubmission",
    Notification = "Notification",
    Paper = "Paper",
    PaperComment = "PaperComment",
    PaperEvent = "PaperEvent",
    Permission = "Permission",
    Role = "Role",
    Review = "Review",
    Token = "Token",
    User = "User"
}

/**
 * The base model interface that will be used for all of our model types.
 */
export interface Model {
    /** The database id of this Model in its associated database table. */
    id: number
}

/**
 * A dictionary we can use with our model types.
 */
export interface ModelDictionary<T extends Model> {
    [id: number]: T
}
