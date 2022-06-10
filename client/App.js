import React, { useState, useLayoutEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication, cleanupRequest } from './state/authentication'

import HomePage from './components/HomePage'
import UserProfile from './components/authentication/UserProfile'
import RegistrationForm from './components/authentication/RegistrationForm'
import LoginForm from './components/authentication/LoginForm'
import UserNavigation from './components/UserNavigation'
import SubmitDraftForm from './components/papers/SubmitDraftForm'
import SubmissionList from './components/reviews/SubmissionList'
import ViewSubmission from './components/reviews/ViewSubmission'
import Spinner from './components/Spinner'

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
                <header>
                    <section id="navigation">
                        <section className="basic-navigation">
                            <Link to="/about">about</Link>
                            <Link to="/fields">fields</Link>
                            <Link to="/users">users</Link>
                        </section>
                        <UserNavigation />
                    </section>
                    <h1><Link to="/">Peer Review</Link></h1>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={ <HomePage /> } />

                        { /* ========= Authentication ========================= */ }
                        <Route path="/register" element={ <RegistrationForm /> } />
                        <Route path="/login" element={ <LoginForm /> } />
                        <Route path="/user/:id" element={ <UserProfile /> } />

                        { /* ========= Peer Review ============================ */ }
                        <Route path="/publish" element={ <SubmitDraftForm /> } />
                        <Route path="/submissions/" element={ <SubmissionList /> } />
                        <Route path="/submission/:paperId" element={ <ViewSubmission /> }  />
                    </Routes>
                </main>
            </Router>
        )
    }
}

export default App
