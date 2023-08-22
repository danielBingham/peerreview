import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'

import Spinner from '/components/Spinner'

import './JournalMembersListItem.css'

const JournalMembersListItem = function({ member }) {

    // ================ Render State ================================

    // ================== Request Tracking ====================================
    

    // ================= Redux State ================================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()


    // ================= Effect Handling =======================
   

    // ====================== Render ==========================================

    let permissions = "Reviewer"
    if ( member.permissions == "owner") {
        permissions = "Managing Editor"
    } else if ( member.permissions == 'editor' ) {
        permissions = "Editor"
    } else if ( member.permissions == "reviewer") {
        permissions = "Reviewer"
    }

    return (
        <div className="journal-member-list-item">
            <div className="grid-wrapper">
                <div className="user">
                    <UserTag id={ member.userId} />
                </div>
                <div className="permissions">
                    { permissions }
                </div>
            </div>
        </div>
    )

}

export default JournalMembersListItem 
