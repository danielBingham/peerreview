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
import { Model } from "./Model"

/**
 * Represents a permission that can be assigned to either a `User` or to a
 * `Role`. The permission is a single permission of the form
 * `<Entity|Entities>:action`, granting the ability to execute `action` on
 * `<Entity|Entities>`.  Which entity or entities will be defined by setting
 * one of a number of id values relating the permission to the entity in
 * question.
 */
export interface Permission extends Model {
        /** The user this permission is granted to or NULL if this is a role permission.  */
        userId: number

        /** The role this permission is granted to or NULL if this is a user permission.  */
        roleId: number

        /** 
         * The permission being granted.  A string of the form `<Entity|Entities>:action`.   
         *
         * @see database/initialization-scripts/schema.sql -> permission_type
         * for the full list of available permissions.
         **/
        permission: string

        /** The id of the Paper this permission grants rights on, if any.  */
        paperId?: number

        /** The id of the Journal this permission grants rights on, if any.  */
        journalId?: number

        /** The version of the Paper this permission grants rights on, if any.  */
        version?: number

        /** The id of the PaperEvent this permission grants rights on, if any.  */
        eventId?: number

        /** The id of the Review this permission grants rights on, if any.  */
        reviewId?: number

        /** The id of the PaperComment this permission grants rights on, if any.  */
        paperCommentId?: number

        /** The id of the JournalSubmission this permission grants rights on, if any.  */
        journalSubmissionId?: number
}
