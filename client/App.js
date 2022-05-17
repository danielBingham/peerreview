import React from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import HomePage from './components/HomePage'
import UserProfile from './components/authentication/UserProfile'
import RegistrationForm from './components/authentication/RegistrationForm'
import LoginForm from './components/authentication/LoginForm'
import UserNavigation from './components/UserNavigation'
import SubmitDraftForm from './components/peer-review/SubmitDraftForm'

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

    /**
     * Render the header, navigation.
     */
    return (
        <Router>
            <header>
                <section id="navigation">
                    <UserNavigation />
                </section>
                <h1>Peer Review</h1>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={ <HomePage /> } />
                    <Route path="/register" element={ <RegistrationForm /> } />
                    <Route path="/login" element={ <LoginForm /> } />
                    <Route path="/user/:id" element={ <UserProfile /> } />
                    <Route path="/publish" element={ <SubmitDraftForm /> } />
                </Routes>
            </main>
        </Router>
    );
}

export default App
