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
    
    const reputation = useSelector(function(state) {
        if ( ! currentUser ) {
            return null
        }

        if ( ! state.reputation.dictionary[currentUser.id] ) {
            return null
        }

        return state.reputation.dictionary[currentUser.id][props.fieldId]
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

    let currentReputation = null
    if ( currentUser && field ) {
       currentReputation = ( 
           <div className="current-reputation">You have <strong>{ reputation ? reputation.reputation : 0}</strong> reputation in <Field field={field} /></div>
       )
    }

    let reputationRequirements = null
    if ( field ) {
        reputationRequirements = (
            <>
                <div className="publish reputation-requirement"> 
                    { reputationThresholds.publish * field.averageReputation } 
                    <div className="label">To Publish</div>
                </div>
                <div className="review reputation-requirement">
                    { reputationThresholds.review * field.averageReputation } 
                    <div className="label">To Review</div>
                </div>
                <div className="referee reputation-requirement">
                    { reputationThresholds.referee * field.averageReputation } 
                    <div className="label">To Vote and Respond</div>
                </div>
            </>
        )
    }

    return (
        <div className="reputation-thresholds">
            <div className="header"><h2>Reputation</h2></div>
            { currentReputation }
            <div className="explanation">To publish, review, or referee papers in this field, you will need to meet the reputation thresholds outlined below.  You only need to meet the threshold in one of the fields a paper is tagged with in order to act on that paper.</div>
            <div className="reputation-requirements-wrapper">
                { reputationRequirements }
            </div>
        </div>
    )
}

export default ReputationThresholds
