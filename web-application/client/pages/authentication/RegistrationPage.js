import React from 'react'

import RegistrationForm from '/components/authentication/RegistrationForm'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './RegistrationPage.css'

const RegistrationPage = function(props) {

    return (
        <div id="registration-page" className="page">
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
                <p>
If you register with ORCID, we'll attempt to use your ORCID with <a
href="https://openalex.org">OpenAlex</a> to generate initial reputation for
you.
                </p>
            </div>
            <ORCIDAuthenticationButton />
        </div>
    )
}

export default RegistrationPage
