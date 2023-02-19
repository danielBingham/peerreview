import React, { useState, useEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import logger from '/logger'

import { getConfiguration, cleanupRequest as cleanupSystemRequest } from '/state/system'
import { getThresholds, cleanupRequest as cleanupReputationRequest } from '/state/reputation'
import { getAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'
import { getFeatures, cleanupRequest as cleanupFeaturesRequest } from '/state/features'

// Admin page for managing features.  Must be logged in and an admin to load it
// here.
import AdminPage from '/pages/AdminPage'

import Header from '/components/header/Header'
import NeedEmailConfirmationNotice from '/components/authentication/NeedEmailConfirmationNotice'

import HomePage from '/pages/HomePage'
import AboutPage from '/pages/AboutPage'

import RegistrationPage from '/pages/authentication/RegistrationPage'
import LoginPage from '/pages/authentication/LoginPage'
import OrcidAuthenticationPage from '/pages/authentication/OrcidAuthenticationPage'
import EmailConfirmationPage from '/pages/authentication/EmailConfirmationPage'
import ResetPasswordPage from '/pages/authentication/ResetPasswordPage'
import ResetPasswordRequestPage from '/pages/authentication/ResetPasswordRequestPage'
import AcceptInvitationPage from '/pages/authentication/AcceptInvitationPage'

import ReputationInitializationPage from '/pages/users/ReputationInitializationPage'
import UsersListPage from '/pages/users/UsersListPage'
import UserProfilePage from '/pages/users/UserProfilePage'
import UserAccountPage from '/pages/users/UserAccountPage'
import UserProfileEditForm from '/components/users/account/UserProfileEditForm'
import UserAccountDetailsForm from '/components/users/account/UserAccountDetailsForm'

import FieldsListPage from '/pages/fields/FieldsListPage'
import FieldPage from '/pages/fields/FieldPage'

import SubmitPage from '/pages/papers/SubmitPage'
import DraftPaperPage from '/pages/papers/DraftPaperPage'
import UploadPaperVersionPage from '/pages/papers/UploadPaperVersionPage'

import ReviewPapersListPage from '/pages/papers/ReviewPapersListPage'
import DraftPapersListPage from '/pages/papers/DraftPapersListPage'

import PublishedPaperPage from '/pages/papers/PublishedPaperPage'
import PaperSearchPage from '/pages/papers/PaperSearchPage'

import ErrorBoundary from '/errors/ErrorBoundary'
import Spinner from '/components/Spinner'

import './app.css';


/**
 * App component acts as the root for the component tree, loading the layout
 * and all other components.
 */
const App = function(props) {
    const [ retries, setRetries ] = useState(0)

    // ======= Request Tracking =====================================
  
    const [configurationRequestId, setConfigurationRequestId] = useState(null)
    const configurationRequest = useSelector(function(state) {
        if ( ! configurationRequestId ) {
            return null
        } else {
            return state.system.requests[configurationRequestId]
        }
    })

    const [reputationThresholdsRequestId, setReputationThresholdsRequestId] = useState(null)
    const reputationThresholdsRequest = useSelector(function(state) {
        if ( ! reputationThresholdsRequestId ) {
            return null
        } else {
            return state.system.requests[reputationThresholdsRequestId]
        }
    })
    

    const [ featuresRequestId, setFeaturesRequestId] = useState(null)
    const featuresRequest = useSelector(function(state) {
        if ( featuresRequestId ) {
            return state.features.requests[featuresRequestId]
        } else {
            return null
        }
    })

    const [authenticationRequestId, setAuthenticationRequestId] = useState(null)
    const authenticationRequest = useSelector(function(state) {
        if ( ! authenticationRequestId ) {
            return null
        } else {
            return state.authentication.requests[authenticationRequestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const configuration = useSelector(function(state) {
        return state.system.configuration
    })

    const reputationThresholds = useSelector(function(state) {
        return state.reputation.thresholds
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useEffect(function() {
        setConfigurationRequestId(dispatch(getConfiguration()))
    }, [])

    useEffect(function() {
        if ( configurationRequest && configurationRequest.state == 'fulfilled') {
            // Logger is a singleton, this will effect all other imports.
            logger.setLevel(configuration.log_level)
            setReputationThresholdsRequestId(dispatch(getThresholds()))
            setFeaturesRequestId(dispatch(getFeatures()))
            setAuthenticationRequestId(dispatch(getAuthentication()))
        } else if ( configurationRequest && configurationRequest.state == 'failed') {
            if ( retries < 5 ) {
                setConfigurationRequestId(dispatch(getConfiguration()))
                setRetries(retries+1)
            }
        }
    }, [ configurationRequest ])

    useEffect(function() {
        return function cleanup() {
            if ( reputationThresholdsRequestId ) {
                dispatch(cleanupSystemRequest({ requestId: reputationThresholdsRequestId }))
            }
        }
    }, [ reputationThresholdsRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( configurationRequestId ) {
                dispatch(cleanupSystemRequest({ requestId: configurationRequestId }))
            }
        }
    }, [ configurationRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( authenticationRequestId ) {
                dispatch(cleanupAuthenticationRequest({ requestId: authenticationRequestId }))
            }
        }
    }, [ authenticationRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( featuresRequestId ) {
                dispatch(cleanupFeaturesRequest({ requestId: featuresRequestId }))
            }
        }
    }, [ featuresRequestId ])

    // ======= Render ===============================================

    if ( ! configurationRequestId || ! authenticationRequestId || ! reputationThresholdsRequestId || ! featuresRequestId) {
        return (
            <Spinner />
        )
    } else if ( (configurationRequest && configurationRequest.state != 'fulfilled')
        || (authenticationRequest && authenticationRequest.state != 'fulfilled')
        || (reputationThresholdsRequest && reputationThresholdsRequest.state != 'fulfilled')
        || (featuresRequest && featuresRequest.state != 'fulfilled')
    ) {
        if (configurationRequest && configurationRequest.state == 'failed' && retries < 5) {
            return (<div className="error">Attempt to retrieve configuration from the backend failed, retrying...</div>)
        } else if (configurationRequest && configurationRequest.state == 'failed' && retries >= 5 ) {
            return (<div className="error">Failed to connect to the backend.  Try refreshing.</div>)
        } else if (authenticationRequest && authenticationRequest.state == 'failed' ) {
            return (<div className="error">Authentication request failed with error: {authenticationRequest.error}.</div>)
        } else if (reputationThresholdsRequest && reputationThresholdsRequest.state == 'failed' ) {
            return (<div className="error">Attempt to retrieve reputation thresholds failed with error: {reputationThresholdsRequest.error}.</div>)
        } else if ( featuresRequest & featuresRequest.state == 'failed' ) {
            return (<div className="error">Attempt to retrieve feature list failed with error: { featuresRequest.error}</div> )
        }

        return (
            <Spinner />
        )
    } 

    if ( configuration == null ) {
        return (<Spinner />)
    }

    // Once our requests have finished successfully, we can render the full
    // site.  We should only reach here when all of the requests have been
    // fulfilled.
    return (
        <ErrorBoundary>
            <Router>
                { currentUser && currentUser.status == 'unconfirmed' && <NeedEmailConfirmationNotice /> }
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={ <HomePage /> } />
                        <Route path="/about" element={ <AboutPage />} />
                        <Route path="/admin" element={ <AdminPage />} />

                        { /* ========== Authentication Controls =============== */ }
                        <Route path="/register" element={ <RegistrationPage /> } />
                        <Route path="/login" element={ <LoginPage /> } />
                        <Route path="/orcid/authentication" element={<OrcidAuthenticationPage />} />
                        <Route path="/orcid/connect" element={<OrcidAuthenticationPage />} />
                        <Route path="/email-confirmation" element={ <EmailConfirmationPage />} />
                        <Route path="/reset-password" element={ <ResetPasswordPage /> } />
                        <Route path="/reset-password-request" element={ <ResetPasswordRequestPage /> } />
                        <Route path="/accept-invitation" element={ <AcceptInvitationPage /> } />

                        { /* ========== Users ================================= */ }
                        <Route path="/reputation/initialization" element={ <ReputationInitializationPage /> } /> 
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
                        <Route path="/submit" element={ <SubmitPage /> }  />
                        <Route path="/review" element={ <ReviewPapersListPage /> } />
                        <Route path="/drafts/" element={ <DraftPapersListPage /> } />
                        <Route path="/draft/:id" element={ <DraftPaperPage tab="reviews" /> }  />
                        <Route path="/draft/:id/versions/upload" element={ <UploadPaperVersionPage /> } />
                        <Route path="/draft/:id/reviews" element={ <DraftPaperPage tab="reviews" /> } />
                        <Route path="/draft/:id/drafts" element={ <DraftPaperPage tab="drafts" /> } />
                        <Route path="/draft/:id/version/:versionNumber" element={ <DraftPaperPage tab="reviews" /> } />
                        <Route path="/draft/:id/version/:versionNumber/reviews" element={ <DraftPaperPage tab="reviews" /> } />
                        <Route path="/draft/:id/version/:versionNumber/drafts" element={ <DraftPaperPage tab="drafts" /> } />

                        { /* ========= Published Papers ===================== */ }
                        <Route path="/search" element={ <PaperSearchPage /> } />
                        <Route path="/paper/:id" element={ <PublishedPaperPage tab="paper" /> } />
                        <Route path="/paper/:id/reviews" element={ <PublishedPaperPage tab="reviews" /> } />
                        <Route path="/paper/:id/drafts" element={ <PublishedPaperPage tab="drafts" /> } />
                        <Route path="/paper/:id/version/:versionNumber" element={ <PublishedPaperPage tab="drafts" /> } />
                        <Route path="/paper/:id/version/:versionNumber/reviews" element={ <PublishedPaperPage tab="reviews" /> } />
                        <Route path="/paper/:id/version/:versionNumber/drafts" element={ <PublishedPaperPage tab="drafts" /> } />
                    </Routes>
                </main>
            </Router>
        </ErrorBoundary>
    )
}

export default App
