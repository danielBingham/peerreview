import React, { useState, useLayoutEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication, cleanupRequest } from '/state/authentication'

import Header from '/components/header/Header'

import HomePage from '/pages/HomePage'

import RegistrationPage from '/pages/authentication/RegistrationPage'
import LoginPage from '/pages/authentication/LoginPage'

import UsersListPage from '/pages/users/UsersListPage'
import UserProfilePage from '/pages/users/UserProfilePage'

import FieldsListPage from '/pages/fields/FieldsListPage'
import FieldPage from '/pages/fields/FieldPage'

import PublishPage from '/pages/papers/PublishPage'
import DraftPaperPage from '/pages/papers/DraftPaperPage'

import ReviewPapersListPage from '/pages/papers/ReviewPapersListPage'
import DraftPapersListPage from '/pages/papers/DraftPapersListPage'

import PublishedPaperPage from '/pages/papers/PublishedPaperPage'

import Spinner from '/components/Spinner'

import './app.css';


/**
 * App component acts as the root for the component tree, loading the layout and all other
 * components.
 *
 * Usage:
 * ```
 * <App />
 * ```
 */
const App = function(props) {

    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.authentication.requests[requestId]
        }
    })

    useLayoutEffect(function() {
        if ( ! currentUser && ! requestId ) {
            setRequestId(dispatch(getAuthentication()))
        }

        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest(requestId))
            }
        }

    }, [ currentUser, requestId ])


    if ( ! currentUser && ! requestId ) {
        return (
            <Spinner />
        )
    } else if (request && request.state != 'fulfilled') {
        return (
            <Spinner />
        )
    } else {   
        /**
         * Render the header, navigation.
         */
        return (
            <Router>
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={ <HomePage /> } />

                        { /* ========== Authentication Controls =============== */ }
                        <Route path="/register" element={ <RegistrationPage /> } />
                        <Route path="/login" element={ <LoginPage /> } />

                        { /* ========== Users ================================= */ }
                        <Route path="/users" element={ <UsersListPage /> } />
                        <Route path="/user/:id" element={ <UserProfilePage /> } />

                        { /* ========== fields ================================= */ }
                        <Route path="/fields" element={ <FieldsListPage /> } />
                        <Route path="/field/:id" element={ <FieldPage /> } />

                        { /* ========= Draft Papers  ============================ */ }
                        <Route path="/publish" element={ <PublishPage /> } />
                        <Route path="/review" element={ <ReviewPapersListPage /> } />
                        <Route path="/drafts/" element={ <DraftPapersListPage /> } />
                        <Route path="/draft/:id" element={ <DraftPaperPage /> }  />

                        { /* ========= Published Papers ===================== */ }
                        <Route path="/paper/:id" element={ <PublishedPaperPage /> } />
                    </Routes>
                </main>
            </Router>
        )
    }
}

export default App
