import React, { useState, useEffect, useLayoutEffect }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {

    // ======= Render State =========================================
    
    const [name, setName] = useState('')
    const [institution, setInstitution] = useState('')
    const [location, setLocation] = useState('')
    const [bio, setBio] = useState('')

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const onSubmit = function(event) {
        event.preventDefault()

        const user = { ...currentUser }
        user.name = name
        user.institution = institution
        user.location = location
        user.bio = bio

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================

    useLayoutEffect(function() {
        if ( ! currentUser.name ) {
            setName('')
        } else {
            setName(currentUser.name)
        } 

        if ( ! currentUser.institution ) {
            setInstitution('')
        } else {
            setInstitution(currentUser.institution)
        }
        if ( ! currentUser.location ) {
            setLocation('')
        } else {
            setLocation(currentUser.location)
        }

        if ( ! currentUser.bio ) {
            setBio('')
        } else {
            setBio(currentUser.bio)
        }
    }, [])

    // Clean up request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
   
    let result = null
    if ( request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Update successful.
            </div>
        )
    } else if ( request && request.state == 'failed') {
        result = (
            <div className="request-failure">
                Request failed: { request.error }.
            </div>
        )
    }

    let submit = ( <input type="submit" name="submit" value="Submit" /> )
    if ( request && request.state == 'pending') {
        submit = ( <Spinner /> )
    }

    return (
        <div className='user-profile-edit-form'>
            <form onSubmit={onSubmit}>
                <div className="form-field name">
                    <label htmlFor="name">Name</label><input type="text"
                        name="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>
                <div className="form-field institution">
                    <label htmlFor="institution">Institution</label><input type="text"
                        institution="institution"
                        value={institution}
                        onChange={(event) => setInstitution(event.target.value)}
                    />
                </div>
                <div className="form-field location">
                    <label htmlFor="location">Location</label><input type="text"
                        location="location"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                    />
                </div>
                <div className="form-text bio">
                    <label htmlFor="bio">Biography</label>
                    <textarea name="bio" value={bio} onChange={ (event) => setBio(event.target.value) }></textarea>
                </div>
                <div className="result">{result}</div>
                <div className="form-submit submit">
                    { submit }
                </div>
            </form>
        </div>
    )
}

export default UserProfileEditForm
