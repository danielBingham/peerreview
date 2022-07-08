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
                    fields.push(<div key={userField.field.id} className="field-wrapper"><Field field={userField.field} /> {userField.reputation}</div>)
                }
            } else {
                const userField = sortedFields[0]
                fields.push(<div key={userField.field.id} className="field-wrapper"><Field field={userField.field} /> {userField.reputation}</div>)
            }
        }

        return (
            <div className="user-badge">
                <div className="user-tag" ><div className="user-profile-picture"></div><Link to={ `/user/${user.id}` }>{user.name}</Link> ({user.reputation})</div> 
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
