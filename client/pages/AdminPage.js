import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import FeatureRow from '/components/admin/FeatureRow'

import './AdminPage.css'

const AdminPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const features = useSelector(function(state) {
        return state.features.dictionary
    })

    const navigate = useNavigate()
    const dispatch = useDispatch()


    // Only admins and superadmins may be here.
    useEffect(function() {
        if ( ! currentUser || (currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin')) {
            navigate("/")
        }
    }, [ currentUser ])

    const rows = []
    for(const name in features ) {
        rows.push(
            <FeatureRow key={name} name={name} />
        )
    }

    return (
        <div id="admin" className="page">
            <div className="header">
                <h2>Admin</h2>
            </div>
            <div className="feature-rows-header">
                <span className="feature-name">Feature Name</span>
                <span className="feature-status">Feature Status</span>
                <span className="feature-controls">Migration Controls</span>
            </div>
            {rows}
            <div className="example">
                { features['example'] && features['example'].status == 'enabled' ? <span>Example enabled!</span> : <span></span> }
            </div>
        </div>
    )
}

export default AdminPage
