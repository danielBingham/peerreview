import React from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import HomePage from './components/HomePage'
import UserProfile from './components/UserProfile'
import RegistrationForm from './components/RegistrationForm'
import LoginForm from './components/LoginForm'
import AuthenticationNavigation from './components/AuthenticationNavigation'

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
export default class App extends React.Component {

    /**
     * Takes no props.
     */
    constructor(props) {
        super(props)

    }

    /**
     * Render the header, navigation.
     */
    render() {
        return (
        <Router>
            <section className="navigation">
                <AuthenticationNavigation />
            </section>
            <section className="app">
                <header>
                    <h1>Peer Review</h1>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={ <HomePage /> } />
                        <Route path="/register" element={ <RegistrationForm /> } />
                        <Route path="/login" element={ <LoginForm /> } />
                        <Route path="/user/:id" element={ <UserProfile /> } />
                    </Routes>
                </main>
            </section>
        </Router>
        );
    }
}
