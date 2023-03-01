import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getReputation, cleanupRequest } from '/state/reputation'

import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import './ReputationThresholds.css'

const ReputationThresholds = function(props) {

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.fields.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
    
    const reputationThresholds = useSelector(function(state) {
        return state.reputation.thresholds
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const field = useSelector(function(state) {
        return state.fields.dictionary[props.fieldId]
    })
    
    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    /**
     * Request the field matching the id given in props, to ensure we have it.
     */
    useEffect(function() {
        if ( currentUser && props.fieldId ) {
            setRequestId(dispatch(getReputation(currentUser.id, props.fieldId)))
        }
    }, [ currentUser, props.fieldId ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================


    let reputationRequirements = null
    if ( field ) {
        reputationRequirements = (
            <>
                <div className="publish reputation"> 
                    { reputationThresholds.publish * field.averageReputation } 
                    <div className="label">Publish</div>
                </div>
                <div className="review reputation">
                    { reputationThresholds.review * field.averageReputation } 
                    <div className="label">Review</div>
                </div>
                <div className="referee reputation">
                    { reputationThresholds.referee * field.averageReputation } 
                    <div className="label">Referee</div>
                </div>
            </>
        )
    }

    return (
        <div className="reputation-thresholds">
            <div className="header"><h2>Thresholds</h2></div>
            <div className="content">
                { reputationRequirements }
            </div>
        </div>
    )
}

export default ReputationThresholds
