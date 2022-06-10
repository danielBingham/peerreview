import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import systemReducer from './system'
import usersReducer from './users'
import papersReducer from './papers'
import fieldsReducer from './fields'
import reviewsReducer from './reviews'
import authenticationReducer from './authentication'


const reducers = combineReducers({
    system: systemReducer,
    users: usersReducer,
    authentication: authenticationReducer,
    papers: papersReducer,
    reviews: reviewsReducer,
    fields: fieldsReducer
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
