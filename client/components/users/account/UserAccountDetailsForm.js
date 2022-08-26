import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import ChangePasswordForm from './widgets/ChangePasswordForm'
import ChangeEmailForm from './widgets/ChangeEmailForm'

import ORCIDTag from '/components/authentication/ORCIDTag'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import './UserAccountDetailsForm.css'

const UserAccountDetailsForm = function(props) {
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    let orcidIdConnection = null
    if ( currentUser && currentUser.orcidId ) {
        orcidIdConnection = (
            <>
                <h2>Connected ORCID iD</h2>
                <ORCIDTag id={ currentUser.orcidId } /> 
            </>
        )
    } else {
        orcidIdConnection = (
            <>
                <h2>Connect your ORCID iD</h2>
                <ORCIDAuthenticationButton connect={true} />
            </>
        )
    }


    return (
        <div className="user-account-details-form">
            <ChangePasswordForm />
            <ChangeEmailForm />
            <div className="orcid-connection">
                { orcidIdConnection }
            </div>

        </div>
    )

}

export default UserAccountDetailsForm
