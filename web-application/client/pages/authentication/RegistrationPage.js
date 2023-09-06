import React from 'react'

import { Page, PageBody } from '/components/generic/Page'

import RegistrationForm from '/components/authentication/RegistrationForm'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './RegistrationPage.css'

const RegistrationPage = function(props) {

    return (
        <Page id="registration-page">
            <PageBody>
                <RegistrationForm />
                <div className="sso-options">
                    <p>
    Or register using your ORCID iD.  To register with an ORCID iD, you must have
    an email publicly visible on your ORCID profile.  
    </p>
    <p>
        If you don't have an email
    publicly visible on your ORCID profile, you can create an account using email
    and password and connect your ORCID to your Peer Review account from the
    Settings Page.  
    </p>
                </div>
                <ORCIDAuthenticationButton />
            </PageBody>
        </Page>
    )
}

export default RegistrationPage
