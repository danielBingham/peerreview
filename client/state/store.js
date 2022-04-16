import { configureStore } from '@reduxjs/toolkit'
import usersReducer from './users'
import authenticationReducer from './authentication'

export default configureStore({
    reducer: {
        users: usersReducer,
        authentication: authenticationReducer
    }
})
