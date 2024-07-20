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

export enum RequestMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE"
}

export enum RequestType {
    Authentication = "Authentication",
    Feature = "Feature",
    Field = "Field",
    File = "File",
    Job = "Job",
    Journal = "Journal",
    JournalSubmission = "JournalSubmission",
    Notification = "Notification",
    PaperComment = "PaperComment",
    PaperEvent = "PaperEvent",
    Paper = "Paper",
    Review = "Review",
    System = "System",
    User = "User" 
}

export enum RequestState {
    Pending = "pending",
    Failed = "failed",
    Fulfilled = "Fulfilled"
}


export interface Request {
    type: RequestType
    requestId: string

    method: RequestMethod 
    endpoint: string

    timestamp: number
    state: string

    error: string
    errorData: any

    status: number | null

    result: any
}

export interface RequestCacheMeta {
    cleaned: boolean
    busted: boolean
    uses: number
}

export interface RequestInitial {
    type: RequestType
    requestId: string
    method: RequestMethod 
    endpoint: string
}

export interface RequestFailed {
    type: RequestType
    requestId: string
    error: string
    errorData?: any
    status: number
}

export interface RequestFulfilled {
    type: RequestType
    requestId: string
    status: number
    result: any
}

export interface RequestCleaned {
    type: RequestType
    requestId: string
    cacheTTL?: number
}
