import fetchMock from 'fetch-mock'

import logger from '../../../client/logger'

import store from '../../../client/state/store'
import { reset, setConfiguration } from '../../../client/state/system'
import { getAuthentication, postAuthentication, deleteAuthentication } from '../../../client/state/authentication'
import RequestTracker from '../../../client/state/helpers/requestTracker'

import { backend } from '../fixtures/api'
import { getTracker, waitForState } from '../helpers/helpers'


// ========================== Test Fixtures ===================================

const credentials = {
    email: 'john.doe@email.com',
    password: 'password'
}

let configuration = {
    backend: '/api/0.0.0'
}

// ========================== Helper Methods ==================================


describe('in client/state/authentication.js', function() {

    beforeAll(function() {
        // disable logging
        //logger.level = -1

        store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
    })

    describe('getAuthentication()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should set the currentUser', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

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

            const requestId = store.dispatch(getAuthentication())
            deferred.resolve({
                user: backend.users.dictionary[1],
                settings: backend.settings.dictionary[1]
            })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.authentication.requests[requestId] && state.authentication.requests[requestId].state == 'fulfilled'
            })

            expect(state.authentication.currentUser).toEqual(backend.users.dictionary[1])
            expect(state.authentication.settings).toEqual(backend.settings.dictionary[1])
        })
    })

    describe('postAuthentication()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should complete the request when the backend returns with 200 and a user', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: credentials
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postAuthentication(credentials.email, credentials.password))
            deferred.resolve({
                user: backend.users.dictionary[1],
                settings: backend.settings.dictionary[1]
            })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.authentication.requests[requestId] && state.authentication.requests[requestId].state == 'fulfilled'
            })

            expect(state.authentication.currentUser).toEqual(backend.users.dictionary[1])
        })
    })

    xdescribe('deleteAuthentication()', function() {
        let windowSpy
        beforeEach(function() {
            windowSpy = jest.spyOn(window, "window", "get")
        })

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
            windowSpy.mockRestore()
        })

        it('should complete the request when the backend returns with 200', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/authentication'

            // First, lets put someone in currentUser and confirm they are there.
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

            windowSpy.mockImplementation(function() {
                return {
                    location: {
                        href: ''
                    }
                }
            })

            let requestId = store.dispatch(getAuthentication())
            deferred.resolve({
                user: backend.users.dictionary[1],
                settings: backend.settings.dictionary[1]
            })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            let state = await waitForState(store, function(state) {
                return state.authentication.requests[requestId] && state.authentication.requests[requestId].state == 'fulfilled'
            })

            expect(state.authentication.currentUser).toEqual(backend.users.dictionary[1])
            expect(state.authentication.settings).toEqual(backend.settings.dictionary[1])

            // Now we can delete them.
            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' }
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )


            requestId = store.dispatch(deleteAuthentication())
            deferred.resolve({ status: 200, body: {} })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            state = await waitForState(store, function(state) {
                return state.authentication.requests[requestId] && state.authentication.requests[requestId].state == 'fulfilled'
            })

            expect(state.authentication.currentUser).toEqual(null)
            expect(state.authentication.settings).toEqual(null)
        })
    })
})
