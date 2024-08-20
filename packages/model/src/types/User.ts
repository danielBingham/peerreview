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

import { File } from './File'

export enum UserStatus {
    Invited = 'invited',
    Unconfirmed = 'unconfirmed',
    Confirmed = 'confirmed'
}

export enum UserPermissions {
    User = 'user',
    Moderator = 'moderator',
    Admin = 'admin',
    SuperAdmin = 'superadmin'
}

export interface UserJournalMembership {
    journalId: number
    permissions: string
    createdDate: string
    updatedDate: string
}

/**
 * This is the user's public facing data.
 */
export interface User extends Model {
    orcidId: string
    name: string
    bio: string
    location: string
    institution: string
    file: File | null
    createdDate: string
    updatedDate: string
    memberships: UserJournalMembership[]
}

/**
 * This extends the public facing User model with the user's private data.
 */
export interface FullUser extends User {
    email: string
    status: UserStatus 
    permissions: UserPermissions 
}

export interface PartialUser {
    id?: number
    orcidId?: string
    name?: string
    email?: string
    status?: UserStatus
    password?: string | null
    permissions?: UserPermissions
    bio?: string
    location?: string
    institution?: string
    file?: File | null
    fileId?: number
}

export interface UserAuthorization {
    token?: string
    password?: string
}

export interface UserQuery {
    id: number | number[]
    name?: string | string[]
    orcidId: string | string[]

    page?: number
    relations: string[]
}
