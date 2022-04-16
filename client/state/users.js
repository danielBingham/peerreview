import { createSlice } from '@reduxjs/toolkit'
import configuration from './config'


export const userSlice = createSlice({
    name: 'users',
    initialState: {
        users: {},
    },
    reducers: {
        receive: function(state, action) {
            state.users[action.payload.id] = action.payload
        },
        request: function(state, action) {
            state.users[action.payload.id] = {
                requested: true
            }
        },
        requestFailed: function(state, action) {
            state.users[action.payload.id] = {
                requested: true,
                error: action.payload.error
            }

        }
        
    }
})

export const fetchUser = function(id) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.request(id))
        const response = await fetch(configuration.backend + '/users/' + id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const user = await response.json()
        dispatch(userSlice.actions.receive(user))
    }
}

export const postUser = function(user) {
    return async function(dispatch, getState) {
        console.log('postUser')
        console.log(user)
        const response = await fetch(configuration.backend + '/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        })
        const responseUser = await response.json()
        dispatch(userSlice.actions.receive(responseUser))
    }
}

export const {recieve, request, requestFailed}  = userSlice.actions

export default userSlice.reducer
