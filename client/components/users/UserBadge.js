import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

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

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUser(props.id)))
    }, [ ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( user && user.fields ) {
        const fields = [] 
        if ( user.fields.length > 0) {
            let sortedFields = [ ...user.fields ]
            sortedFields.sort((a, b) => { 
                const repDiff = b.reputation - a.reputation 
                if ( repDiff !== 0 ) {
                    return repDiff
                }
                return b.field.id - a.field.id
            })
            if ( props.fields ) {
                sortedFields = sortedFields.filter((uf) => props.fields.find((f) => f.id == uf.field.id) !== undefined)

                for (const userField of sortedFields ) {
                    fields.push(<div key={userField.field.id} className="field-wrapper"><Field field={userField.field} /> {parseInt(userField.reputation).toLocaleString()}</div>)
                }
            } else {
                const userField = sortedFields[0]
                fields.push(<div key={userField.field.id} className="field-wrapper"><Field field={userField.field} /> {parseInt(userField.reputation).toLocaleString()}</div>)
            }
        }

        return (
            <div className="user-badge">
                <div className="user-tag" ><div className="user-profile-picture"></div><Link to={ `/user/${user.id}` }>{user.name}</Link> ({parseInt(user.reputation).toLocaleString()})</div> 
                <div className="institution">{user.institution}</div>
                <div className="badge-fields">
                    {fields}
                </div>
            </div>
        )
    } else {
        return (<Spinner />)
    }

}

export default UserBadge 
