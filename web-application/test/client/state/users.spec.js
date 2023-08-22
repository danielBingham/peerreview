import fetchMock from 'fetch-mock'

import logger from '../../../client/logger'

import store from '../../../client/state/store'
import { reset, setConfiguration } from '../../../client/state/system'
import { getUsers, postUsers, getUser, putUser, patchUser, deleteUser } from '../../../client/state/users'

import { backend } from '../fixtures/api'
import { users } from '../fixtures/submission'

import { getTracker, waitForState } from '../helpers/helpers'

let configuration = {
    backend: '/api/0.0.0'
}

describe('in client/state/users.js', function() {
    beforeAll(function() {
        // disable logging
        //logger.level = -1
        store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        Date.now = jest.fn(() => 'NOW')
    })

    describe('getUsers()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should store the returned users in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

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

            const requestId = store.dispatch(getUsers('test'))
            deferred.resolve(backend.users)

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary).toEqual(backend.users.dictionary)
        })
    })

    describe('postUsers()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned user in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/users'

            fetchMock.mock({
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: users[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postUsers(users[1]))
            deferred.resolve({ 
                entity: backend.users.dictionary[1],
                relations: backend.users.relations
            })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary[1]).toEqual(backend.users.dictionary[1])
        })
    })

    describe('getUser(id)', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the dictionary with the returned user', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/user/' + backend.users.dictionary[1].id 

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

            const requestId = store.dispatch(getUser(backend.users.dictionary[1].id))
            deferred.resolve({ entity: backend.users.dictionary[1], relations: backend.users.relations })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary[1]).toEqual(backend.users.dictionary[1])
        })
    })

    describe('putUser(user)', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned user in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }

            const user = {
                ...users[1]
            }
            user.id = backend.users.dictionary[1].id 

            const endpoint = '/user/' + user.id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: user
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putUser(user))
            deferred.resolve({ entity: backend.users.dictionary[1], relations: backend.users.relations })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary[1]).toEqual(backend.users.dictionary[1])
        })

        xit('should update currentUser when the returned user has the same id as currentUser', function() {})
    })

    describe('patchUser(user)', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned user in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }

            const user = {
                ...users[1]
            }
            user.id = backend.users.dictionary[1].id 

            const endpoint = '/user/' + user.id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: user
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchUser(user))
            deferred.resolve({ entity: backend.users.dictionary[1], relations: backend.users.relations })

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary[1]).toEqual(backend.users.dictionary[1])
        })

        xit('should update currentUser when the returned user has the same id as currentUser', function() {})
    })

    describe('deleteUser(user)', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }

            const user = {
                ...users[1]
            }
            user.id = backend.users.dictionary[1].id 

            const endpoint = '/user/' + user.id 

            // First we need to setup our initial state so that it has a user
            // in it.  This gives us a user to delete.  We need to make sure
            // we've setup the initial state properly, so we need to assert on
            // that.
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

            const initialRequestId = store.dispatch(getUser(user.id))
            deferred.resolve({ entity: backend.users.dictionary[1], relations: backend.users.relations })

            let state = await waitForState(store, function(state) {
                return state.users.requests[initialRequestId] && state.users.requests[initialRequestId].state == 'fulfilled'
            })

            expect(state.users.dictionary[1]).toEqual(backend.users.dictionary[1])

            // Now we can test that delete executes properly.
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

            const requestId = store.dispatch(deleteUser(user))
            deferred.resolve({ status: 200, body: { entity: { id: backend.users.dictionary[1].id }}})

            state = await waitForState(store, function(state) {
                return state.users.requests[requestId] && state.users.requests[requestId].state == 'fulfilled'
            })

            expect(state.users.dictionary).toEqual({})
        })
    })

})
