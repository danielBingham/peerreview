import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom';

import UserProfile from './components/UserProfile';
import RegistrationForm from './components/RegistrationForm';

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
        super(props);
    }

    /**
     * Render the header, navigation.
     */
    render() {
        return (
        <Router>
            <section className="navigation">
                <Link to="login">login</Link> 
                <Link to="register">register</Link>
            </section>
            <section className="app">
                <header>
                    <h1>Peer Review</h1>
                    <Routes>
                        <Route path="/register" element={ <RegistrationForm /> } />
                        <Route path="/user/:id" element={ <UserProfile /> } />
                    </Routes>
                </header>
            </section>
        </Router>
        );
    }
}
