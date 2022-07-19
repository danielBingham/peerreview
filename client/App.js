import React, { useState, useEffect, useLayoutEffect } from 'react'
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
import AboutPage from '/pages/AboutPage'

import RegistrationPage from '/pages/authentication/RegistrationPage'
import LoginPage from '/pages/authentication/LoginPage'

import UsersListPage from '/pages/users/UsersListPage'
import UserProfilePage from '/pages/users/UserProfilePage'
import UserAccountPage from '/pages/users/UserAccountPage'
import UserProfileEditForm from '/components/users/account/UserProfileEditForm'
import UserAccountDetailsForm from '/components/users/account/UserAccountDetailsForm'

import FieldsListPage from '/pages/fields/FieldsListPage'
import FieldPage from '/pages/fields/FieldPage'

import PublishPage from '/pages/papers/PublishPage'
import DraftPaperPage from '/pages/papers/DraftPaperPage'
import UploadPaperVersionPage from '/pages/papers/UploadPaperVersionPage'

import ReviewPapersListPage from '/pages/papers/ReviewPapersListPage'
import DraftPapersListPage from '/pages/papers/DraftPapersListPage'

import PublishedPaperPage from '/pages/papers/PublishedPaperPage'
import PaperSearchPage from '/pages/papers/PaperSearchPage'

import Spinner from '/components/Spinner'

import './app.css';


/**
 * App component acts as the root for the component tree, loading the layout
 * and all other components.
 */
const App = function(props) {

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.authentication.requests[requestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useLayoutEffect(function() {
        setRequestId(dispatch(getAuthentication()))
    }, [ ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( ! requestId ) {
        return (
            <Spinner />
        )
    } else if (request && request.state != 'fulfilled') {
        if ( request.state == 'pending' ) {
            return (
                <Spinner />
            )
        } else if (request.state == 'failed') {
            return (
                <div className="error">Authentication request failed.  Report this as a bug and try reloading.</div>
            )
        }
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
                        <Route path="/about" element={ <AboutPage />} />

                        { /* ========== Authentication Controls =============== */ }
                        <Route path="/register" element={ <RegistrationPage /> } />
                        <Route path="/login" element={ <LoginPage /> } />

                        { /* ========== Users ================================= */ }
                        <Route path="/users" element={ <UsersListPage /> } />
                        <Route path="/user/:id" element={ <UserProfilePage /> } />
                        <Route path="/account">
                            <Route path=":pane" element={ <UserAccountPage /> } />
                            <Route index element={ <UserAccountPage /> } />
                        </Route>

                        { /* ========== fields ================================= */ }
                        <Route path="/fields" element={ <FieldsListPage /> } />
                        <Route path="/field/:id" element={ <FieldPage /> } />

                        { /* ========= Draft Papers  ============================ */ }
                        <Route path="/publish" element={ <PublishPage /> } />
                        <Route path="/review" element={ <ReviewPapersListPage /> } />
                        <Route path="/drafts/" element={ <DraftPapersListPage /> } />
                        <Route path="/draft/:id" element={ <DraftPaperPage /> }  />
                        <Route path="/draft/:id/versions/upload" element={ <UploadPaperVersionPage /> } />
                        <Route path="/draft/:id/version/:versionNumber" element={ <DraftPaperPage /> } />

                        { /* ========= Published Papers ===================== */ }
                        <Route path="/search" element={ <PaperSearchPage /> } />
                        <Route path="/paper/:id" element={ <PublishedPaperPage /> } />
                    </Routes>
                </main>
            </Router>
        )
    }
}

export default App
