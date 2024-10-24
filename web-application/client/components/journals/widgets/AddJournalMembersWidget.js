import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'
import UserInput from '/components/users/input/UserInput'

import './AddJournalMembersWidget.css'

const AddJournalMembersWidget = function(props) {

    // ================ Render State ================================
    const [ order, setOrder ] = useState(2)

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
        const existingMember = props.members.find((m) => m.userId == user.id)
        if ( existingMember ) {
            return
        }

        const newMembers = [ ...props.members ]

        const member = {
            userId: user.id,
            permissions: 'reviewer',
            order: order 
        }

        setOrder(order+1)

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

    selectedMemberViews.push(
        <div key="header" className="selected-member header">
            <div className="member">
                Member
            </div>
            <div className="role">
                Role
            </div>
        </div>
    )

    const membersOrdered = [ ...props.members ]
    membersOrdered.sort((a, b) => a.order - b.order)
    for(const member of membersOrdered) {
        selectedMemberViews.push( 
            <div key={member.userId} className="selected-member">
                <div className="member">
                    <UserTag id={member.userId} /> 
                </div>
                <div className="role">
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
                explanation={'Add members to your journal.  These could be additional managing editors, editors, or scholars you are adding to a standing active reviewer pool. You can add additional members, update member permissions, or remove members at any time after creation.  [WIP: You can also build a database of non-member reviewers who you can invite to review on a case by case basis.]'}
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
