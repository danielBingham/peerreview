import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import systemReducer from './system'
import featuresReducer from './features'
import jobsReducer from './jobs'
import authenticationReducer from './authentication'
import usersReducer from './users'
import notificationsReducer from './notifications'
import papersReducer from './papers'
import paperVersionsReducer from './paperVersions'
import paperEventsReducer from './paperEvents'
import paperCommentsReducer from './paperComments'
import reviewsReducer from './reviews'
import journalsReducer from './journals'
import journalSubmissionsReducer from './journalSubmissions'
import fieldsReducer from './fields'
import settingsReducer from './settings'
import filesReducer from './files'
import responsesReducer from './responses'
import testingReducer from './testing'


const reducers = combineReducers({
    system: systemReducer,
    features: featuresReducer,
    jobs: jobsReducer,
    authentication: authenticationReducer,
    users: usersReducer,
    notifications: notificationsReducer,
    papers: papersReducer,
    paperVersions: paperVersionsReducer,
    paperEvents: paperEventsReducer,
    paperComments: paperCommentsReducer,
    reviews: reviewsReducer,
    journals: journalsReducer,
    journalSubmissions: journalSubmissionsReducer,
    fields: fieldsReducer,
    settings: settingsReducer,
    files: filesReducer,
    responses: responsesReducer,
    testing: testingReducer
})

const rootReducer = function(state, action) {
    if (action.type === 'system/reset') {
        state = undefined
    }
    return reducers(state,action)
}

export default configureStore({
    reducer: rootReducer
})
