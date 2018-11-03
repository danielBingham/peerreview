import React, { Component } from 'react';
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
export default class App extends Component {

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
                </header>
            </section>
        );
    }
}
