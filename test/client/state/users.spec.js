import fetchMock from 'fetch-mock'

import configuration from '../../../client/configuration'

import store from '../../../client/state/store'
import { reset } from '../../../client/state/system'
import { getUsers, postUsers, getUser, putUser, patchUser, deleteUser } from '../../../client/state/users'
import RequestTracker from '../../../client/state/helpers/requestTracker'


// ========================== Test Fixtures ===================================
const postSubmission = {
    1: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        password: 'password'
    },
    2: {
        name: 'Jane Doe',
        email: 'jane.doe@email.com',
        password: 'password'
    }
}
const putSubmission = {
    1: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@email.com',
        password: 'password'
    },
    2: {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@email.com',
        password: 'password'
    }
}
const patchSubmission = {
    1: {
        id: 1,
        name: 'John Doe',
    },
    2: {
        id: 2,
        name: 'Jane Doe',
    }
}

const database = [ 
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@email.com'
    },
    {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@email.com'
    }
]

const expectedUserState = {
    oneUser: {
        1: {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com'
        }
    },
    allUsers: {
        1: {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com'
        },
        2: {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@email.com'
        }

    }
}

// ========================== Helper Methods ==================================

/**
 * Return a promise that resolves on an update to store using `subscribe`.
 */
const stateUpdate = function(store) {
    return new Promise(function(resolve, reject) {
        store.subscribe(function() {
            resolve(store.getState())
        })
    })
}

describe('in client/state/users.js', function() {

    describe('getUsers()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUsers())
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUsers())
            deferred.resolve(database)

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }
            const expectedState = expectedUserState.allUsers

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUsers())
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUsers())
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

    })

    describe('postUsers()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: postSubmission[1] 
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postUsers(postSubmission[1]))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: postSubmission[1] 
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postUsers(postSubmission[1]))
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedState = expectedUserState.oneUser
            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }
            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: postSubmission[1] 
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postUsers(postSubmission[1]))
            deferred.resolve({ status: 404 })


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                error:  'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: postSubmission[1] 
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postUsers(postSubmission[1]))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                error:  'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

    })

    describe('getUser(id)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUser(database[0].id))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }
            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUser(database[0].id))
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedState = expectedUserState.oneUser 
            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUser(database[0].id))
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getUser(database[0].id))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

    })

    describe('putUser(user)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: putSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putUser(putSubmission[1]))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'PUT',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }
            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + putSubmission[1].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: putSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putUser(putSubmission[1]))
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedState = expectedUserState.oneUser 
            const expectedRequestTracker = {
                requestMethod: 'PUT',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + putSubmission[1].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: putSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putUser(putSubmission[1]))
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'PUT',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {

            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: putSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putUser(putSubmission[1]))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'PUT',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})

        })

    })

    describe('patchUser(user)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: patchSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchUser(patchSubmission[1]))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'PATCH',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }
            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + patchSubmission[1].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: patchSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchUser(patchSubmission[1]))
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedState = expectedUserState.oneUser 
            const expectedRequestTracker = {
                requestMethod: 'PATCH',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + patchSubmission[1].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: patchSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchUser(patchSubmission[1]))
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'PATCH',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: patchSubmission[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchUser(patchSubmission[1]))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'PATCH',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

    })

    describe('deleteUser(user)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })


        it('should return add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(deleteUser(database[0]))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null
            }
            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/user/' + database[0].id 

            // First we need to setup our initial state so that it has a user
            // in it.  This gives us a user to delete.  We need to make sure
            // we've setup the initial state properly, so we need to assert on
            // that.
            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const initialRequestId = store.dispatch(getUser(database[0].id))
            deferred.resolve(database[0])

            let initialState = await stateUpdate(store) 
            if ( initialState.users.requests[initialRequestId].state == 'pending') {
                // Wait for the next update.
                initialState = await stateUpdate(store)
            }

            const initialExpectedState = expectedUserState.oneUser
            expect(initialState.users.users).toEqual(initialExpectedState)

            // Now we can test that delete executes properly.
            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(deleteUser(database[0]))
            deferred.resolve({ status: 200 })

            let state = await stateUpdate(store) 
            if ( state.users.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedState = {}
            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual(expectedState)
        })

        it('should handle a non-200 status as an error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(deleteUser(database[0]))
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + database[0].id

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(deleteUser(database[0]))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.users.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined
            }

            expect(state.users.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.users.users).toEqual({})
        })

    })

})
