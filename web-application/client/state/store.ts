import { configureStore, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import systemReducer from '/state/foundation/System'
import featureReducer from '/state/foundation/Feature'
import jobsReducer from '/state/foundation/Job'
import authenticationReducer from '/state/foundation/Authentication'
import userReducer from '/state/entities/User'
import notificationsReducer from './notifications'
import papersReducer from './papers'
import paperEventsReducer from './paperEvents'
import paperCommentsReducer from './paperComments'
import reviewsReducer from './reviews'
import journalsReducer from './journals'
import journalSubmissionsReducer from './journalSubmissions'
import fieldsReducer from './fields'
import filesReducer from './files'
import testingReducer from '/state/foundation/Test'

const reducers = combineReducers({
    system: systemReducer,
    features: featureReducer,
    jobs: jobsReducer,
    authentication: authenticationReducer,
    users: userReducer,
    notifications: notificationsReducer,
    papers: papersReducer,
    paperEvents: paperEventsReducer,
    paperComments: paperCommentsReducer,
    reviews: reviewsReducer,
    journals: journalsReducer,
    journalSubmissions: journalSubmissionsReducer,
    fields: fieldsReducer,
    files: filesReducer,
    testing: testingReducer
})

const rootReducer = function(state: any, action: PayloadAction) {
    if (action.type === 'system/reset') {
        state = undefined
    }
    return reducers(state,action)
}

export const store = configureStore({
    reducer: rootReducer
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

