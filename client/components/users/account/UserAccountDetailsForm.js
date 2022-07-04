import React, { useState, useEffect } from 'react'

import ChangePasswordForm from './widgets/ChangePasswordForm'
import ChangeEmailForm from './widgets/ChangeEmailForm'

import './UserAccountDetailsForm.css'

const UserAccountDetailsForm = function(props) {

    return (
        <div className="user-account-details-form">
            <ChangePasswordForm />
            <ChangeEmailForm />
        </div>
    )

}

export default UserAccountDetailsForm
