import React from 'react'
import { useSelector} from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'

import UserProfileEditForm from '/components/users/account/UserProfileEditForm'
import UserAccountDetailsForm from '/components/users/account/UserAccountDetailsForm'
import UserSettingsForm from '/components/users/account/UserSettingsForm'

import ChangePasswordForm from '/components/users/account/widgets/ChangePasswordForm'
import ChangeEmailForm from '/components/users/account/widgets/ChangeEmailForm'

import ORCIDTag from '/components/authentication/ORCIDTag'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'

import { UserCircleIcon, EnvelopeIcon, Cog8ToothIcon, LockClosedIcon } from '@heroicons/react/24/outline'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import Spinner from '/components/Spinner'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { tab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Render =====================================
    const selectedTab = ( tab ? tab : 'profile')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'profile' ) {
        content = ( <UserProfileEditForm /> )
    } else if ( selectedTab == 'change-password' ) {
        content = ( <ChangePasswordForm /> )
    } else if ( selectedTab == 'change-email' ) {
        content = ( <ChangeEmailForm /> )
    } else if ( selectedTab == 'orcid' ) {
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
                <div className="orcid-connection">
                    <h2>Connect your ORCID iD</h2>
                    <p>Authenticate with your ORCID iD to connect it to your account.  When you connect your ORCID iD to you're account, we will attempt to generate initial reputation for you using <a href="https://openalex.org">Open Alex</a>.</p>
                    <ORCIDAuthenticationButton connect={true} />
                </div>
            )
        }
        content = orcidIdConnection
    } else if ( selectedTab == 'settings' ) {
        content = ( <UserSettingsForm /> ) 
    }

    return (
        <>
            <PageTabBar>
                <PageTab url="/account/profile" selected={selectedTab == 'profile'}>
                    <UserCircleIcon /> Public Profile
                </PageTab>
                <PageTab url="/account/change-email" selected={selectedTab == 'change-email'}>
                    <EnvelopeIcon /> Change Email
                </PageTab>
                <PageTab url="/account/change-password" selected={selectedTab == 'change-password'}>
                    <LockClosedIcon /> Change Password
                </PageTab>
                <PageTab url="/account/orcid" selected={selectedTab == 'orcid'}>
                    <img src="/img/ORCID.svg" /> ORCID iD
                </PageTab>
                <PageTab url="/account/settings" selected={selectedTab == 'settings'}>
                    <Cog8ToothIcon /> Settings
                </PageTab>
            </PageTabBar>
            <div id="user-account-page" className="page">
                { currentUser && content }
        
                { ! currentUser && 
                    <div className="login-notice">
                        <p>You must be logged in to view the account page.</p>
                        <p>Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</p>
                    </div> }
            </div>
        </>
    )

}

export default UserAccountPage
