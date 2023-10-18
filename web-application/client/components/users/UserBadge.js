import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'
import './UserBadge.css'

const UserBadge = function(props) {
    
    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        return state.users.dictionary[props.id]
    })

    const paper = useSelector(function(state) {
        if ( props.paperId ) {
            return state.papers.dictionary[props.paperId]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUser(props.id)))
    }, [ props.id, props.paperId ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( user ) {
        return (
            <div className="user-badge">
                <div className="badge-grid">
                    <UserProfileImage userId={user.id} />
                    <div className="info-wrapper">
                        <div className="user-tag" ><Link to={ `/user/${user.id}` }>{user.name}</Link></div> 
                        <div className="institution">{user.institution}</div>
                    </div>
                </div>
            </div>
        )
    } else {
        return (<Spinner />)
    }

}

export default UserBadge 
