import React, { useState, useEffect, useLayoutEffect }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import { patchUser, cleanupRequest } from '/state/users'

import FileUploadInput from '/components/files/FileUploadInput'
import Spinner from '/components/Spinner'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {

    // ======= Render State =========================================

    const [ file, setFile ] = useState(null)
    const [name, setName] = useState('')
    const [institution, setInstitution] = useState('')
    const [location, setLocation] = useState('')
    const [bio, setBio] = useState('')

    const [nameError, setNameError] = useState(null)
    const [institutionError, setInstitutionError] = useState(null)
    const [locationError, setLocationError] = useState(null)
    
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

    const isValid = function(field) {
        let error = false

        if ( ! field || field == 'name' ) {
            if ( name.length <= 0 ) {
                setNameError('no-name')
            } else if ( name.length > 512 ) {
                setNameError('too-long')
            } else {
                setNameError(null)
            }
        }

        if ( ! field || field == 'institution' ) {
            if ( institution.length > 256 ) {
                setInstitutionError('too-long')
            } else {
                setInstitutionError(null)
            }
        }

        if ( ! field || field == 'location' ) {
            if ( location.length > 256 ) {
                setLocationError('too-long')
            } else {
                setLocationError(null)
            }
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        const user = { 
            id: currentUser.id,
            file: file,
            name: name,
            institution: institution,
            location: location,
            bio: bio
        }

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================

    useLayoutEffect(function() {
        if ( ! currentUser.file ) {
            setFile(null)
        } else {
            setFile(currentUser.file) 
        }

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
        if ( ! file && currentUser.file ) {
            setFile(currentUser.file)
        }
    }, [ file ] )

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

    let nameErrorView = null
    let institutionErrorView = null
    let locationErrorView = null

    if ( nameError && nameError == 'no-name' ) {
        nameErrorView = ( <div className="error">Name is required!</div>)
    } else if ( nameError && nameError == 'too-long' ) {
        nameErrorView = ( <div className="error">Name is too long. Limit is 512 characters.</div> )
    }

    if ( institutionError && institutionError == 'too-long' ) {
        institutionErrorView = ( <div className="error">Institution name is too long.  Limit is 256 characters.</div> )
    }

    if ( locationError && locationError == 'too-long' ) {
        locationErrorView = ( <div className="error">Location is too long. Limit is 256 characters.</div> )
    }

    let userProfileImage = ( <UserCircleIcon /> )
    if ( file ) {
        const url = new URL(file.filepath, file.location)
        userProfileImage = (
            <img src={url.href} />
        )
    }

    return (
        <div className='user-profile-edit-form'>
            <form onSubmit={onSubmit}>
                <div className="profile-picture">
                    <div className="profile-wrapper">
                        <div className="profile-image">
                            { userProfileImage }
                        </div>
                    </div>
                    <div className="input-wrapper">
                        <FileUploadInput setFile={setFile} types={[ 'image/jpeg', 'image/png' ]} />
                    </div>
                </div>
                <div className="form-field name">
                    <label htmlFor="name">Name</label><input type="text"
                        name="name"
                        value={name}
                        onBlur={(event) => isValid('name')}
                        onChange={(event) => setName(event.target.value)}
                    />
                    { nameErrorView }
                </div>
                <div className="form-field institution">
                    <label htmlFor="institution">Institution</label><input 
                        type="text"
                        name="institution"
                        value={institution}
                        onBlur={(event) => isValid('institution')}
                        onChange={(event) => setInstitution(event.target.value)}
                    />
                    { institutionErrorView }
                </div>
                <div className="form-field location">
                    <label htmlFor="location">Location</label><input 
                        type="text"
                        name="location"
                        value={location}
                        onBlur={(event) => isValid('location')}
                        onChange={(event) => setLocation(event.target.value)}
                    />
                    { locationErrorView }
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
