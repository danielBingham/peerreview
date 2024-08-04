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

import { ResultType } from "../types/Query"
import { Notification, NotificationType } from '../types/Notification'

import { generateFixture } from './generateFixture'

const notifications: Notification[] = [
    {
        id: 1,
        userId: 1,
        type: NotificationType.Author_Paper_Submitted,
        description: 'Your co-author has submitted your paper!',
        path: '/paper/1',
        isRead: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    {
        id: 2,
        userId: 2,
        type: NotificationType.Author_Paper_Submitted,
        description: 'Your co-author has submitted your paper!',
        path: '/paper/1',
        isRead: true,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
]

export function getNotificationFixture(filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture<Notification>(notifications, filter)
}
