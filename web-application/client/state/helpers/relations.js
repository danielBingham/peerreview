import { setFieldsInDictionary } from '../fields'
import { setJournalsInDictionary } from '../journals'
import { setJournalSubmissionsInDictionary } from '../journalSubmissions'
import { setPapersInDictionary } from '../papers'
import { setUsersInDictionary } from '../users'
import { setReviewsInDictionary } from '../reviews'


const setRelationsInState = function(relations) {
    return function(dispatch, getState) {
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
            }
        }
    }
}

export default setRelationsInState
