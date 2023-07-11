import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import systemReducer from './system'
import featuresReducer from './features'
import jobsReducer from './jobs'
import authenticationReducer from './authentication'
import reputationReducer from './reputation'
import usersReducer from './users'
import papersReducer from './papers'
import reviewsReducer from './reviews'
import journalsReducer from './journals'
import fieldsReducer from './fields'
import settingsReducer from './settings'
import filesReducer from './files'
import responsesReducer from './responses'
import testingReducer from './testing'


const reducers = combineReducers({
    system: systemReducer,
    features: featuresReducer,
    jobs: jobsReducer,
    reputation: reputationReducer,
    authentication: authenticationReducer,
    users: usersReducer,
    papers: papersReducer,
    reviews: reviewsReducer,
    journals: journalsReducer,
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
