import fetchMock from 'fetch-mock'

import logger from '../../../client/logger'

// Mock store for testing.
import store, { reset, getRequest, postRequest, putRequest, patchRequest, deleteRequest } from '../fixtures/store'

// Testing helpers.
import { getTracker, waitForState } from '../helpers/helpers'

// State under test.
import { makeTrackedRequest } from '../../../client/state/helpers/requestTracker'

// Needs to match the initial state for state.system.configuration
let configuration = {
    backend: '/api/0.0.0'
}


describe('in client/state/helpers/requestTracker.js', function() {

    beforeAll(function() {
        // disable logging
        logger.level = -1
        Date.now = jest.fn(() => 'NOW')
    })

    describe('makeTrackedRequest()', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
        })

        it('should return a requestId pointing to a pending request tracker when called', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getRequest(function() {}))
            const expectedRequestTracker = getTracker(requestId, 'GET', endpoint)

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'pending'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('it should update the request with `state == fulfilled` when fetch resolves with a response', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const responseBody = {
                test: 'test'
            }
            const requestId = store.dispatch(getRequest(function() {}))
            deferred.resolve(responseBody)

            const expectedRequestTracker = getTracker(requestId, 'GET', endpoint)
            expectedRequestTracker.state = 'fulfilled'
            expectedRequestTracker.status = 200
            expectedRequestTracker.result = responseBody 

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'fulfilled'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should update the request with `state == failed` when fetch resolves with a non-200 response', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const responseBody = {
                error: 'error-type'
            }
            const requestId = store.dispatch(getRequest(function() {}))
            deferred.resolve({ status: 400, body: responseBody })

            const expectedRequestTracker = getTracker(requestId, 'GET', endpoint)
            expectedRequestTracker.state = 'failed'
            expectedRequestTracker.status = 400 
            expectedRequestTracker.error = responseBody.error

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'failed'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should handle a thrown error', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(getRequest(function() {}))
            deferred.resolve({ throws: new TypeError('Fetch failed!')})

            const expectedRequestTracker = getTracker(requestId, 'GET', endpoint)
            expectedRequestTracker.state = 'failed'
            expectedRequestTracker.error = 'frontend-request-error'
            expectedRequestTracker.status = 0 

            let state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'failed'
            })

            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)
        })

        xit('should cache and reuse a request', function() {})

        xit('should cleanup an expired cached request when called', function() {})

        it('should include `Content-Type` header and json encode the body for a `POST` request', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            const requestBody = {
                test: 'test'
            }

            // The fetch configuration.
            const fetchOptions = {
                url: configuration.backend + endpoint,
                method: 'POST',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: requestBody
            }

            // In this test, we're basically just testing that we match this
            // mock.  The test will fail if an error if we don't
            fetchMock.mock(fetchOptions, new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postRequest(requestBody, function() {}))
            const expectedRequestTracker = getTracker(requestId, 'POST', endpoint)

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'pending'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)
        })

        it('should include `Content-Type` header and json encode the body for a `PATCH` request', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            const requestBody = {
                test: 'test'
            }

            // The fetch configuration.
            const fetchOptions = {
                url: configuration.backend + endpoint,
                method: 'PATCH',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: requestBody
            }

            // In this test, we're basically just testing that we match this
            // mock.  The test will fail if an error if we don't
            fetchMock.mock(fetchOptions, new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchRequest(requestBody, function() {}))
            const expectedRequestTracker = getTracker(requestId, 'PATCH', endpoint)

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'pending'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)

        })

        it('should include `Content-Type` header and json encode the body for a `PUT` request', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/test'

            const requestBody = {
                test: 'test'
            }

            // The fetch configuration.
            const fetchOptions = {
                url: configuration.backend + endpoint, 
                method: 'PUT',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: requestBody
            }

            // In this test, we're basically just testing that we match this
            // mock.  The test will fail if an error if we don't
            fetchMock.mock(fetchOptions, new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putRequest(requestBody, function() {}))
            const expectedRequestTracker = getTracker(requestId, 'PUT', endpoint)

            const state = await waitForState(store, function(state) {
                return state.test.requests[requestId] && state.test.requests[requestId].state == 'pending'
            })
            expect(state.test.requests[requestId]).toEqual(expectedRequestTracker)

        })
        xit('should not include `Content-Type` header or json encode the body when given FormData for `POST` request', function() {})
       
    })
})
