import React, { useState, useEffect, useLayoutEffect }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchUser, cleanupRequest } from '/state/users'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {
    const [name, setName] = useState('')
    const [institution, setInstitution] = useState('')
    const [location, setLocation] = useState('')
    const [bio, setBio] = useState('')

    const [status, setStatus] = useState(null)
    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const onSubmit = function(event) {
        event.preventDefault()

        const user = { ...currentUser }
        user.name = name
        user.institution = institution
        user.location = location
        user.bio = bio

        if ( requestId && ! request ) {
            setStatus('You moved too fast and now we have a wierd problem.  Please report this as a bug and try again.')
            return
        }

        if ( request ) {
            dispatch(cleanupRequest(request))
        }
        setRequestId(dispatch(patchUser(user)))
    }

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

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            setStatus('Update sucessful.')
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ request ])


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
                <div className="status">{status}</div>
                <div className="form-submit submit">
                    <input type="submit" name="submit" value="Submit" />
                </div>
            </form>
        </div>
    )
}

export default UserProfileEditForm
