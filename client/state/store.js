import { configureStore } from '@reduxjs/toolkit'
import usersReducer from './users'

export default configureStore({
    reducer: {
        users: usersReducer
    }
})
