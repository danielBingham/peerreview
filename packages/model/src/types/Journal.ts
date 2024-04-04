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

export enum JournalMemberPermissions {
    Owner = 'owner',
    Editor = 'editor',
    Reviewer = 'reviewer'
}

export interface JournalMember {
    journalId: number
    userId: number
    order: number
    permissions: JournalMemberPermissions,
    createdDate: string
    updatedDate: string
}

export enum JournalModel {
    Public = 'public',
    Open = 'open',
    Closed = 'closed'
}
export enum JournalAnonymity {
    ForcedIdentified = 'forced-identified',
    DefaultIdentified = 'default-identified',
    ReviewersAnonymous = 'reviewers-identified',
    DoubleAnonymous = 'double-anonymous'
}

export interface Journal extends Model {
    name: string
    description: string
    model?: JournalModel
    anonymity?: JournalAnonymity
    createdDate: string
    updatedDate: string
    members: JournalMember[]
}

export interface PartialJournal {
    description?: string
    model?: JournalModel
    anonymity?: JournalAnonymity
}
