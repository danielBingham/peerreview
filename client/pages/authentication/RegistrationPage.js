import React from 'react'

import RegistrationForm from '/components/authentication/RegistrationForm'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './RegistrationPage.css'

const RegistrationPage = function(props) {

    return (
        <div id="registration-page" className="page">
            <RegistrationForm />
            <ORCIDAuthenticationButton />
        </div>
    )
}

export default RegistrationPage
