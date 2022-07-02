import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'
import './UserBadge.css'

const UserBadge = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    const user = useSelector(function(state) {
        if ( state.users.dictionary[props.id] ) {
            return state.users.dictionary[props.id]
        } else {
            return null
        }
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getUser(props.id)))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }

    }, [ request ])


    if ( user && user.fields ) {
        const fields = [] 
        if ( user.fields.length > 0) {
            let sortedFields = [ ...user.fields ]
            sortedFields.sort((a, b) => b.reputation - a.reputation)
           
            const userField =  sortedFields[0]
            fields.push(<div key={userField.field.id} className="field-wrapper"><Field field={userField.field} /> {userField.reputation}</div>)
        }

        return (
            <div className="user-badge">
                <div className="user-tag" ><Link to={ `/user/${user.id}` }>{user.name}</Link> ({user.reputation})</div> 
                <div className="institution">{user.institution}</div>
                {fields}
            </div>
        )
    } else {
        return (<Spinner />)
    }

}

export default UserBadge 
