import React from 'react'

import LoginForm from '/components/authentication/LoginForm'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './LoginPage.css'

const LoginPage = function(props) {

    return (
        <div id="login-page" className="page">
            <LoginForm />
            <ORCIDAuthenticationButton />
        </div>
    )
}

export default LoginPage
