import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import Spinner from '/components/Spinner'
import './UserTag.css'

const UserTag = function(props) {

    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        if ( state.users.dictionary[props.id] ) {
            return state.users.dictionary[props.id]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! user ) {
            setRequestId(dispatch(getUser(props.id)))
        }
    }, [])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId])

    // ======= Render ===============================================

    let content = ( <Spinner local={true} /> ) 
    if ( user ) {
        let name = null
        if ( props.link == false ) {
            name = user.name
        } else {
            name = ( <Link to={ `/user/${user.id}` }>{user.name}</Link> )
        }

        content = ( <> <UserProfileImage userId={user.id} /> { name } </> ) 
    }
                    

    return (
        <span className="user-tag" > { content } </span> 
    )

}

export default UserTag
