import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { validateToken, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'

import ResetPasswordForm from '/components/authentication/ResetPasswordForm'

import './ResetPasswordPage.css'

const ResetPasswordPage = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()


    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(function() {
        const token = searchParams.get('token')

        if ( ! token ) {
            // TODO Is there a better way to handle this?
            navigate("/")
        }

        setRequestId(dispatch(validateToken(token, 'reset-password')))
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    let content = ( <Spinner /> )
    if ( request && request.state == 'fulfilled' ) {
        content = (
            <ResetPasswordForm />
        )
    }

    else if ( request && request.state == 'failed' ) {
        content = (
            <div className="error">
                Something went wrong: { request.error }
            </div>

        )
    }

    return (
        <Page id="reset-password">
            <PageBody>
            { content }
            </PageBody>
        </Page>
    )
}

export default ResetPasswordPage
