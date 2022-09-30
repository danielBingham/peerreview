import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'
import { getReputations, clearQuery, cleanupRequest as cleanupReputationRequest } from '/state/reputation'

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

    const [ reputationRequestId, setReputationRequestId ] = useState(null)
    const reputationRequest = useSelector(function(state) {
        return state.reputation.requests[reputationRequestId]
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

    const reputations = useSelector(function(state) {
        return state.reputation.query[props.id]
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUser(props.id)))
        if ( ! paper ) {
            setReputationRequestId(dispatch(getReputations(props.id, { pageSize: 1 })))
        } else {
            setReputationRequestId(dispatch(getReputations(props.id, { paperId: props.paperId })))
        }
    }, [ props.id, props.paperId ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    useEffect(function() {
        return function cleanup() {
            if ( reputationRequestId ) {
                dispatch(clearQuery({ userId: props.id }))
                dispatch(cleanupReputationRequest({ requestId: reputationRequestId }))
            }
        }
    }, [ reputationRequestId ])

    // ======= Render ===============================================

    if ( user ) {
        const fields = [] 
        if ( reputations && reputations.results.length > 0) {
            for (const reputation of reputations.results) {
                fields.push(<div key={reputation.field.id} className="field-wrapper"><Field field={reputation.field} /> {parseInt(reputation.reputation).toLocaleString()}</div>)
            }
        }

        return (
            <div className="user-badge">
                <div className="badge-grid">
                    <UserProfileImage file={user.file} />
                    <div className="info-wrapper">
                        <div className="user-tag" ><Link to={ `/user/${user.id}` }>{user.name}</Link> ({parseInt(user.reputation).toLocaleString()})</div> 
                        <div className="institution">{user.institution}</div>
                    </div>
                    <div className="badge-fields">
                        {fields}
                    </div>
                </div>
            </div>
        )
    } else {
        return (<Spinner />)
    }

}

export default UserBadge 
