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

import Spinner from '/components/Spinner'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { tab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const navigate = useNavigate()
    const selectTab = function(tabName) {
        if ( tabName == 'profile' ) {
            const url = `/account/profile`
            navigate(url)
        } else if ( tabName == 'change-password' ) {
            const url =`/account/change-password`
            navigate(url)
        } else if ( tabName == 'change-email' ) {
            const url =`/account/change-email`
            navigate(url)
        } else if ( tabName == 'orcid' ) {
            const url =`/account/orcid`
            navigate(url)
        } else if ( tabName == 'settings' ) {
            const url = `/account/settings`
            navigate(url)
        }
    }

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
                <>
                    <h2>Connect your ORCID iD</h2>
                    <ORCIDAuthenticationButton connect={true} />
                </>
            )
        }
        content = orcidIdConnection
    } else if ( selectedTab == 'settings' ) {
        content = ( <UserSettingsForm /> ) 
    }

    return (
        <>
            <div className="page-tab-bar">
                <div onClick={(e) => selectTab('profile')} className={`page-tab ${ ( selectedTab == 'profile' ? 'selected' : '' )}`}><UserCircleIcon /> Public Profile</div>
                <div onClick={(e) => selectTab('change-email')} className={`page-tab ${ ( selectedTab == 'change-email' ? 'selected' : '')}`}><EnvelopeIcon /> Change Email</div>
                <div onClick={(e) => selectTab('change-password')} className={`page-tab ${ ( selectedTab == 'change-password' ? 'selected' : '')}`}><LockClosedIcon /> Change Password</div>
                <div onClick={(e) => selectTab('orcid')} className={`page-tab ${ ( selectedTab == 'orcid' ? 'selected' : '')}`}><img src="/img/ORCID.svg" /> ORCID iD</div>
                <div onClick={(e) => selectTab('settings')} className={`page-tab ${ ( selectedTab == 'settings' ? 'selected' : '' ) }`}> <Cog8ToothIcon /> Settings</div>
            </div>
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
