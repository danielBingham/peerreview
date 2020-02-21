import React from 'react';
import RegisterUser from './containers/RegisterUser.js';
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
            <section className="app">
                <header>
                    <h1>Peer Review</h1>
                    <RegisterUser />
                </header>
            </section>
        );
    }
}
