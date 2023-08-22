import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'
import UserInput from '/components/users/input/UserInput'

import './AddJournalMembersWidget.css'

const AddJournalMembersWidget = function(props) {

    // ================ Render State ================================

    // ================== Request Tracking ====================================
    

    // ================= Redux State ================================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()

    const onBlur = function(event) {

    }

    const selectMember = function(user) {
        const newMembers = [ ...props.members ]

        const member = {
            userId: user.id,
            permissions: 'reviewer'
        }

        newMembers.push(member)
        props.setMembers(newMembers)
    }

    const assignPermissions = function(member, permissions) {
        member.permissions = permissions

        const newMembers = props.members.filter((e) => e.userId != member.userId)
        newMembers.push(member)
        props.setMembers(newMembers)
    }

    const removeMember = function(member) {
        if ( member.userId == currentUser.id ) {
            return
        }
           
        const newMembers = props.members.filter((e) => e.userId != member.userId)
        props.setMembers(newMembers)
    }

    // ================= Effect Handling =======================
   

    // ====================== Render ==========================================

    const selectedMemberViews = []

    for(const member of props.members) {
        selectedMemberViews.push( 
            <div key={member.userId} className="selected-member">
                <div className="left">
                    <UserTag id={member.userId} /> 
                </div>
                <div className="right">
                    <select 
                        onChange={(e) => assignPermissions(member, e.target.value) } 
                        value={ member.permissions } name="permissions"
                    > 
                        <option value="owner">Managing Editor</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                    </select>
                    { member.userId != currentUser.id && <a href="" onClick={(e) => { e.preventDefault(); removeMember(member) }} ><XMarkIcon  /></a> }
                </div>
            </div>
        )
    }

    return (
        <div className="add-members-widget">
            <UserInput
               label={'Add Members'}
                explanation={'Add members to your journal.  These could be additional managing editors, editors, or scholars you are adding to the reviewer pool. You can add additional members, update member permissions, or remove members at any time after creation.'}
                onBlur={onBlur}
                selectUser={selectMember}
            />
            <div className="selected-members">
                {selectedMemberViews}
            </div>
        </div>
    )

}

export default AddJournalMembersWidget 
