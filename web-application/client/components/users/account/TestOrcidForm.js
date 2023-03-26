import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { postTestingOrcid, getTestingOrcidReset, cleanupRequest } from '/state/testing'
import { getAuthentication, cleanupRequest as cleanupAuthRequest } from '/state/authentication'

import ORCIDTag from '/components/authentication/ORCIDTag'
import Spinner from '/components/Spinner'

import { XMarkIcon } from '@heroicons/react/24/outline'

import './TestOrcidForm.css'


const TestOrcidForm = function(props) {

    // ======= Render State =========================================
    
    const [ orcidId, setOrcidId ] = useState('')
    
    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.testing.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const onSubmit = function(event) {
        event.preventDefault()

        setRequestId(dispatch(postTestingOrcid(orcidId)))

    }

    const reset = function(event) {
        event.preventDefault()

        setRequestId(dispatch(getTestingOrcidReset()))
    }

    // ======= Effect Handling ======================================
   
    useEffect(function() {
        if ( currentUser && currentUser.orcidId && request && request.state == 'fulfilled') {
            navigate("/reputation/initialization", { replace: false, state: { connect: true } })
        } 
    }, [ request ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
    
    let submit = null
    if ( ( request && request.state == 'in-progress') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Set ORCID iD" /> )
    }

    let content = ( <Spinner /> )
    if ( request && request.state == 'pending' ) {
        content = ( <div> <Spinner local={true} /> { currentUser.orcidId ? 'Resetting...' : 'Setting ORCID iD...' }</div> )
    } else {
        if ( currentUser && currentUser.orcidId == null ) {
            content = (
                <form onSubmit={onSubmit}>
                    <h2>Test ORCID iD Flow</h2>
                    <div className="form-field orcid-id">
                        <label htmlFor="orcid-id">ORCID iD</label>
                        <input type="text"
                            name="orcid-id"
                            value={orcidId}
                            onChange={(event) => setOrcidId(event.target.value)}
                        />
                    </div>
                    <div className="submit">
                        { submit }                    
                    </div>
                </form>
            )
        } else {
            content = (
                <div className="orcid"> <ORCIDTag id={ currentUser.orcidId} /> <a href="" onClick={reset}><XMarkIcon /></a></div> 
            )
        }
    }
        

    return (
        <div className="test-orcid-form">
            { content }
        </div>   
    )
}

export default TestOrcidForm


