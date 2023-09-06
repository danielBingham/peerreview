import React, { useEffect } from 'react'
import { useSelector} from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'


import { UserCircleIcon, EnvelopeIcon, Cog8ToothIcon, LockClosedIcon } from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import UserProfileEditForm from '/components/users/account/UserProfileEditForm'
import UserAccountDetailsForm from '/components/users/account/UserAccountDetailsForm'
import UserSettingsForm from '/components/users/account/UserSettingsForm'

import ChangePasswordForm from '/components/users/account/widgets/ChangePasswordForm'
import ChangeEmailForm from '/components/users/account/widgets/ChangeEmailForm'

import ORCIDTag from '/components/authentication/ORCIDTag'
import ORCIDAuthenticationButton from '/components/authentication/ORCIDAuthenticationButton'
import TestOrcidForm from '/components/users/account/TestOrcidForm'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { pageTab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const configuration = useSelector(function(state) {
        return state.system.configuration
    })
   
    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/login')
        }
    }, [])

    // ======= Render =====================================
    const selectedTab = ( pageTab ? pageTab : 'profile')

    const showTest = ( 
        configuration.environment != "production" || 
            (currentUser && 
                (currentUser.permissions == 'admin' || currentUser.permissions == 'superadmin'))
    )

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
                    <p>Authenticate with your ORCID iD to connect it to your account.</p>
                    <ORCIDAuthenticationButton connect={true} />
                </div>
            )
        }
        content = orcidIdConnection
    } else if ( showTest && selectedTab == 'test-orcid') {
        content = ( <TestOrcidForm /> )
    }

    return (
        <Page id="user-account-page">
            <PageHeader>
            </PageHeader>
            <PageTabBar>
                <PageTab url="/account/profile" tab="profile" initial={true}>
                    <UserCircleIcon /> Public Profile
                </PageTab>
                <PageTab url="/account/change-email" tab="change-email">
                    <EnvelopeIcon /> Change Email
                </PageTab>
                <PageTab url="/account/change-password" tab="change-password">
                    <LockClosedIcon /> Change Password
                </PageTab>
                <PageTab url="/account/orcid" tab="orcid">
                    <img src="/img/ORCID.svg" /> ORCID iD
                </PageTab>
                { showTest && <PageTab url="/account/test-orcid" tab="test-orcid">
                    Test ORCID
                </PageTab> }
            </PageTabBar>
            <PageBody>
                { currentUser && content }
            </PageBody>
        </Page>
    )

}

export default UserAccountPage
