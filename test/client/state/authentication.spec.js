
import fetchMock from 'fetch-mock'

import logger from '../../../client/logger'

import store from '../../../client/state/store'
import { reset, setConfiguration } from '../../../client/state/system'
import { makeRequest, completeRequest, getAuthentication, postAuthentication, deleteAuthentication } from '../../../client/state/authentication'
import RequestTracker from '../../../client/state/helpers/requestTracker'


// ========================== Test Fixtures ===================================

const credentials = {
    email: 'john.doe@email.com',
    password: 'password'
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

const expectedState = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@email.com'
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

xdescribe('in client/state/authentication.js', function() {

    beforeAll(function() {
        // disable logging
        logger.level = -1

        store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
    })

    describe('getAuthentication()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })


        it('should add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'pending',
                result: null,
                error: null,
                status: null,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns with 200 and a user', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.authentication.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                result: expectedState,
                error: null,
                status: 200,
                result: database[0]
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

        it('should complete the request when the backend returns with 204', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve({ status: 204 })

            let state = await stateUpdate(store) 
            if ( state.authentication.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                result: null,
                error: null,
                status: 204,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a 4xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a 5xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve({ status: 500 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                result: null,
                error: 'Error: Request failed with status: 500',
                status: 500,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'GET',
                requestEndpoint: endpoint,
                state: 'failed',
                result: null,
                error: 'TypeError: Fetch failed!',
                status: undefined,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

    })

    describe('postAuthentication()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })



        it('should add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials 

                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'pending',
                result: null,
                error: null,
                status: null,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should complete the request when the backend returns with 200 and a user', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve(database[0])

            let state = await stateUpdate(store) 
            if ( state.authentication.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                result: expectedState,
                error: null,
                status: 200,
                result: database[0]
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

        it('should handle 403 as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve({ status: 403 })

            let state = await stateUpdate(store) 
            if ( state.authentication.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                result: null,
                error: 'Error: Attempt to authenticate "' + credentials.email + '" failed.',
                status: 403,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a 4xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a 5xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve({ status: 500 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 500',
                status: 500,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'POST',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

    })

    describe('deleteAuthentication()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })

        beforeEach(function() {
            store.dispatch(makeRequest({ requestId: 1, method: 'POST', endpoint: '/authentication'}))
            store.dispatch(completeRequest({ requestId: 1, status: 200, result: database[0] }))
        })

        it('should add a pending RequestTracker to the store when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(deleteAuthentication())
            let state = store.getState() 

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'pending',
                error: null,
                status: null,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

        it('should complete the request when the backend returns with 200', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(deleteAuthentication())
            deferred.resolve({ status: 200 })

            let state = await stateUpdate(store) 
            if ( state.authentication.requests[requestId].state == 'pending') {
                // Wait for the next update.
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'fulfilled',
                error: null,
                status: 200,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(null)
        })

        it('should handle a 4xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(deleteAuthentication())
            deferred.resolve({ status: 404 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 404',
                status: 404,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

        it('should handle a 5xx status as an error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(deleteAuthentication())
            deferred.resolve({ status: 500 })

            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'Error: Request failed with status: 500',
                status: 500,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(deleteAuthentication())
            deferred.resolve({ throws: new TypeError('Fetch failed!')})


            let state = await stateUpdate(store)
            if ( state.authentication.requests[requestId].state == 'pending') {
                // wait for the next update
                state = await stateUpdate(store)
            }

            const expectedRequestTracker = {
                requestMethod: 'DELETE',
                requestEndpoint: endpoint,
                state: 'failed',
                error: 'TypeError: Fetch failed!',
                status: undefined,
                result: null
            }

            expect(state.authentication.requests[requestId]).toEqual(expectedRequestTracker)
            expect(state.authentication.currentUser).toEqual(expectedState)
        })

    })
})
