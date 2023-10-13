import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import './UserProfileImage.css'

const UserProfileImage = function({ userId, className }) {
    
    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        if ( state.users.dictionary[userId] ) {
            return state.users.dictionary[userId]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! user ) {
            setRequestId(dispatch(getUser(userId)))
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

    let content = ( <Spinner local={true} /> )
    if ( user.file ) {
        const url = new URL(user.file.filepath, user.file.location)
        content = (
            <img src={url.href} />
        )
    } else {
        content = (
            <UserCircleIcon />
        )
    }


    return (
        <div className={ className ? `profile-image ${className}` : "profile-image"}>
            {content}
        </div>
    )

}

export default UserProfileImage
