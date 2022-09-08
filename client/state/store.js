import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import systemReducer from './system'
import reputationReducer from './reputation'
import authenticationReducer from './authentication'
import usersReducer from './users'
import papersReducer from './papers'
import reviewsReducer from './reviews'
import fieldsReducer from './fields'
import settingsReducer from './settings'
import filesReducer from './files'
import responsesReducer from './responses'


const reducers = combineReducers({
    system: systemReducer,
    reputation: reputationReducer,
    authentication: authenticationReducer,
    users: usersReducer,
    papers: papersReducer,
    reviews: reviewsReducer,
    fields: fieldsReducer,
    settings: settingsReducer,
    files: filesReducer,
    responses: responsesReducer
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
