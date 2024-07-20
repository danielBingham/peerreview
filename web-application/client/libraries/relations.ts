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
import { setFieldsInDictionary } from '/state/fields'
import { setJournalsInDictionary } from '/state/journals'
import { setJournalSubmissionsInDictionary } from '/state/journalSubmissions'
import { setPapersInDictionary } from '/state/papers'
import { setUsersInDictionary } from '/state/users'
import { setReviewsInDictionary } from '/state/reviews'
import { setPaperEventsInDictionary } from '/state/paperEvents'
import { setPaperCommentsInDictionary } from '/state/paperComments'

import { QueryRelations } from '@danielbingham/peerreview-model'

import { AppDispatch } from '/state/store'

export function setRelationsInState(relations: QueryRelations) {
    return function(dispatch: AppDispatch) {
        if ( relations ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                if ( relation == 'fields' ) {
                    dispatch(setFieldsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'journals' ) {
                    dispatch(setJournalsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'submissions' ) {
                    dispatch(setJournalSubmissionsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'papers' ) {
                    dispatch(setPapersInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'users' ) {
                    dispatch(setUsersInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'reviews' ) {
                    dispatch(setReviewsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'events' ) {
                    dispatch(setPaperEventsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'paperComments' ) {
                    dispatch(setPaperCommentsInDictionary({ dictionary: dictionary }))
                }
            }
        }
    }
}

