import React from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '/components/authentication/LoginForm'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './LoginPage.css'

const LoginPage = function(props) {

    return (
        <div id="login-page" className="page">
            <LoginForm />
            <div className="inner-wrapper">
                <ORCIDAuthenticationButton />
                <div className="forgot-password">
                    <Link to="/reset-password-request">Forgot password?</Link>
                </div>
                <div className="register">
                    Don't have an account? You can <Link to="/register">create one here</Link>.
                </div>
            </div>
        </div>
    )
}

export default LoginPage
