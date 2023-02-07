import React, { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import ReactMarkdown from 'react-markdown'

import { getUser, cleanupRequest } from '/state/users'

import ORCIDTag from '/components/authentication/ORCIDTag'
import UserProfileImage from '/components/users/UserProfileImage'

import Spinner from '/components/Spinner'

import './UserView.css'

const UserView = function(props) {

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        return state.users.dictionary[props.id]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUser(props.id)))
    }, [ ])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    if ( ! request ) {
        return ( <Spinner /> )
    } else if ( (request && request.state == 'pending')) {
        return ( <Spinner /> )
    } else  if ( request && request.state == 'failed' ) {
        return (
            <article className="user-view">
                <div className="error">
                    Failed to request the user's data: { request.error }.  Please report a bug.
                </div>
            </article>
        )
    } else if ( ! user && request && request.state == 'fulfilled' ) {
        return (
            <article className="user-view">
                <div className="error">
                    Failed to request the user's data: { request.error }.  Please report a bug.
                </div>
            </article>
        )
    } 

    const shouldRenderControls = ( currentUser && user && currentUser.id == user.id)

    return (
        <article id={ user.id } className='user-view'>
            <div className="header">
                <h1>{ user.name }</h1>
                { shouldRenderControls && <div className="controls"><Link to="/account">edit</Link></div> }
            </div>
            <UserProfileImage file={user.file} /> 
            <div className="details">
                <div><span className="label">Name</span> { user.name }</div>
                <div><span className="label">ORCID iD</span> { user.orcidId && <ORCIDTag id={ user.orcidId} />}</div>
                <div><span className="label">Institution</span> { user.institution } </div>
                <div><span className="label">Location</span> { user.location }</div>
                <div><span className="label">Biography</span><ReactMarkdown children={ user.bio } /> </div>
            </div>
        </article>
    )
}

export default UserView 
