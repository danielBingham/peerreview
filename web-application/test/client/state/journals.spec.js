import fetchMock from 'fetch-mock'

import logger from '../../../client/logger'

import store from '../../../client/state/store'
import { reset, setConfiguration } from '../../../client/state/system'
import { getJournals, postJournals, getJournal, putJournal, patchJournal, deleteJournal } from '../../../client/state/journals'

import { backend } from '../fixtures/api'
import { journals } from '../fixtures/submission'

import { getTracker, waitForState } from '../helpers/helpers'

let configuration = {
    backend: '/api/0.0.0'
}

describe('in client/state/journals.js', function() {
    beforeAll(function() {
        // disable logging
        //logger.level = -1
        store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        Date.now = jest.fn(() => 'NOW')
    })

    describe('getJournals()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should store the returned journals in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/journals'

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

            const requestId = store.dispatch(getJournals(null, true))
            deferred.resolve( backend.journals.list)

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary).toEqual(backend.journals.dictionary)
        })
    })

    describe('postJournals()', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned journal in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }
            const endpoint = '/journals'

            fetchMock.mock({
                    url: configuration.backend + endpoint,
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: journals[1]
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(postJournals(journals[1]))
            deferred.resolve(backend.journals.dictionary[1])

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary[1]).toEqual(backend.journals.dictionary[1])
        })
    })

    describe('getJournal(id)', function() {
        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the dictionary with the returned journal', async function() {
            let deferred = { resolve: null, reject: null }

            const endpoint = '/journal/' + backend.journals.dictionary[1].id 

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

            const requestId = store.dispatch(getJournal(backend.journals.dictionary[1].id))
            deferred.resolve(backend.journals.dictionary[1])

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary[1]).toEqual(backend.journals.dictionary[1])
        })

    })

    describe('putJournal(journal)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned journal in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }

            const journal = {
                ...journals[1]
            }
            journal.id = backend.journals.dictionary[1].id 

            const endpoint = '/journal/' + journal.id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PUT',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: journal
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(putJournal(journal))
            deferred.resolve(backend.journals.dictionary[1])

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary[1]).toEqual(backend.journals.dictionary[1])
        })
    })

    describe('patchJournal(journal)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should update the returned journal in the dictionary', async function() {
            let deferred = { resolve: null, reject: null }

            const journal = {
                ...journals[1]
            }
            journal.id = backend.journals.dictionary[1].id 

            const endpoint = '/journal/' + journal.id 

            fetchMock.mock(
                {
                    url: configuration.backend + endpoint,
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: journal
                },
                new Promise(function(resolve, reject) {
                    deferred.resolve = resolve
                    deferred.reject = reject
                })
            )

            const requestId = store.dispatch(patchJournal(journal))
            deferred.resolve(backend.journals.dictionary[1])

            // Wait until Redux has processed all the actions that get fired
            // and the request is returned 'fulfilled'.
            const state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary[1]).toEqual(backend.journals.dictionary[1])
        })
    })

    describe('deleteJournal(journal)', function() {

        afterEach(function() {
            fetchMock.restore()
            store.dispatch(reset())
            store.dispatch(setConfiguration({ backend: '/api/0.0.0' }))
        })

        it('should complete the request when the backend returns', async function() {
            let deferred = { resolve: null, reject: null }

            const journal = {
                ...journals[1]
            }
            journal.id = backend.journals.dictionary[1].id 

            const endpoint = '/journal/' + journal.id 

            // First we need to setup our initial state so that it has a journal
            // in it.  This gives us a journal to delete.  We need to make sure
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

            const initialRequestId = store.dispatch(getJournal(journal.id))
            deferred.resolve(backend.journals.dictionary[1])

            let state = await waitForState(store, function(state) {
                return state.journals.requests[initialRequestId] && state.journals.requests[initialRequestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary[1]).toEqual(backend.journals.dictionary[1])

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

            const requestId = store.dispatch(deleteJournal(journal))
            deferred.resolve({ status: 200, body: {}})

            state = await waitForState(store, function(state) {
                return state.journals.requests[requestId] && state.journals.requests[requestId].state == 'fulfilled'
            })

            expect(state.journals.dictionary).toEqual({})
        })

    })

})
