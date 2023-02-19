import React from 'react'

import './ErrorBoundary.css'

export default class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props)
        this.state = { 
            hasError: false,
            errorMessage: null
        }

    }
    // Update state so the next render will show the fallback UI.
    static getDerivedStateFromError(error) {        
        if ( error instanceof Error ) {
            return { 
                hasError: true,
                errorMessage: error.message
            }  
        } else {
            return {
                hasError: true,
                errorMessage: 'Unknown error occured.'
            }
        }
    }

    // Used for logging error information.  For now we're not going to use
    // this.
    componentDidCatch(error, errorInfo) {
        console.error(error)
    }

    // Render the error UI.
    render() {

        // You can render any custom fallback UI
        if (this.state.hasError) {            
            return ( 
                <div id="error-boundary" className="page">
                    <h1>Peer Review: Error</h1>
                    <p>
                        Something went wrong in a way that we couldn't handle,
                        or haven't handled yet.  Please report this as a bug.
                    </p>
                    <p>You'll find more information in your browser console.</p>
                    <div className="error-message"><span className="label">Error Message:</span> { this.state.errorMessage }</div>
                </div>
            )

        }

        return this.props.children
    }
}
