import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import FeatureFlags from '/components/admin/features/FeatureFlags'

import './AdminPage.css'

const AdminPage = function(props) {


    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================
   
    const navigate = useNavigate()

    // Only admins and superadmins may be here.
    useEffect(function() {
        if ( ! currentUser || (currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin')) {
            navigate("/")
        }
    }, [ currentUser ])

    // ======= Render ===============================================

    return (
        <div id="admin" className="page">
            <FeatureFlags />
        </div>
    )
}

export default AdminPage
