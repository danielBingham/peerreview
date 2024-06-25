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

/**
 * The different permissions a journal member may have, maps to roles in the
 * Journal.
 */
export enum JournalMemberPermissions {
    Owner = 'owner',
    Editor = 'editor',
    Reviewer = 'reviewer'
}

/**
 * A single member of a Journal.
 */
export interface JournalMember {
    /** The database id of the journal this member is attached to. **/
    journalId: number

    /** The database id of the user who is a member. **/
    userId: number

    /** The member's order in the member list. Used to maintain visual consistency. **/
    order: number

    /** This member's permissions. **/
    permissions: JournalMemberPermissions,

    /** Timestamp of members creation. **/
    createdDate: string

    /** Timestamp of last update. **/
    updatedDate: string
}

/**
 * The different default permissions models.
 */
export enum JournalModel {
    Public = 'public',
    Open = 'open',
    Closed = 'closed'
}

/**
 * The different anonymity models.
 */
export enum JournalAnonymity {
    ForcedIdentified = 'forced-identified',
    DefaultIdentified = 'default-identified',
    ReviewersAnonymous = 'reviewers-identified',
    DoubleAnonymous = 'double-anonymous'
}

/**
 * A fully populated journal entity, returned from the database.
 */
export interface Journal extends Model {
    /** The name of the journal. **/
    name: string

    /** A short description of the journal. **/
    description: string

    /** The permissions model the journal is using. **/
    model?: JournalModel

    /** The anonymity model the journal is using. **/
    anonymity?: JournalAnonymity

    /** Timestamp recoriding the time of the journal's creation. **/
    createdDate: string

    /** Timestamp recording the last update. **/
    updatedDate: string

    /** Array containing the Journal's membership. **/
    members: JournalMember[]
}

/**
 * A partially populated Journal, used for updating and creation inputs.
 *
 * @see Journal for documenation of individual fields.
 */
export interface PartialJournal extends Model {
    name?: string
    description?: string
    model?: JournalModel
    anonymity?: JournalAnonymity
}
