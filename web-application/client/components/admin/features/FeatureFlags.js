import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getFeatures, bustRequestCache, cleanupRequest as cleanupFeaturesRequest } from '/state/features'

import FeatureRow from '/components/admin/features/FeatureRow'

import './FeatureFlags.css'

const FeatureFlags = function(props) {
    // ======= Request Tracking =====================================
    
    const [ featuresRequestId, setFeaturesRequestId] = useState(null)
    const featuresRequest = useSelector(function(state) {
        if ( featuresRequestId ) {
            return state.features.requests[featuresRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const features = useSelector(function(state) {
        return state.features.dictionary
    })

    // ======= Effect Handling ======================================
   
    const dispatch = useDispatch()

    useEffect(function() {
        dispatch(bustRequestCache())
        setFeaturesRequestId(dispatch(getFeatures()))
    }, [ ])

    useEffect(function() {
        return function cleanup() {
            if ( featuresRequestId ) {
                dispatch(cleanupFeaturesRequest({ requestId: featuresRequestId }))
            }
        }
    }, [ featuresRequestId ])

    // ======= Render ===============================================
   
    const rows = []
    for(const name in features ) {
        rows.push(
            <FeatureRow key={name} name={name} />
        )
    }

    return (
        <div className="feature-flags">
            <div className="header">
                <h2>Feature Flags and Migrations</h2>
            </div>
            <div className="feature-rows-header">
                <span className="feature-name">Feature Name</span>
                <span className="feature-status">Feature Status</span>
                <span className="feature-controls">Migration Controls</span>
            </div>
            {rows}
        </div>
    )

}

export default FeatureFlags
