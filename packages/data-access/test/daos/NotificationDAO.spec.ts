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

import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import { NotificationDAO } from '../../src/daos/NotificationDAO'

import { getUserNotificationsTableFixture } from '../../src/fixtures/database/UserNotificationsTable'
import { getDAOResultFixture } from '../../src/fixtures/getDAOResultFixture'

import { Notification, getNotificationFixture } from '@journalhub/model'

import { mockCore } from '@journalhub/core'


describe('NotificationDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateNotification()', function() {
        it('should properly hydrate a single Notification based on a single QueryResultRow', async function() {
            const journalSubmissionDAO = new NotificationDAO(mockCore)

            const tableFixture = getUserNotificationsTableFixture()
            const hydratedResult = journalSubmissionDAO.hydrateNotification(tableFixture.rows[0])

            const fixture = getDAOResultFixture<Notification>(getNotificationFixture())

            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateNotifications()', function() {
        it('should properly interpret a QueryResultRow[] and return DAOResult<Notification>', async function() {
            const journalSubmissionDAO = new NotificationDAO(mockCore)

            const tableFixture = getUserNotificationsTableFixture()
            const hydratedResults = journalSubmissionDAO.hydrateNotifications(tableFixture.rows)

            const fixture = getDAOResultFixture<Notification>(getNotificationFixture())
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectNotifications()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getUserNotificationsTableFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const journalSubmissionDAO = new NotificationDAO(mockCore)

            const results = await journalSubmissionDAO.selectNotifications()

            const fixture = getDAOResultFixture<Notification>(getNotificationFixture())
            expect(results).toEqual(fixture)
        })
    })

})
