import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { CheckIcon } from '@heroicons/react/24/outline'

import { FloatingMenu, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuHeader, FloatingMenuItem } 
    from '/components/generic/floating-menu/FloatingMenu'

import Spinner from '/components/Spinner'
import UserSuggestions from '/components/users/input/UserSuggestions'
import UserTag from '/components/users/UserTag'

import './AssignmentFilterMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const AssignmentFilterMenu = function(props) {

    // ============ Query State ===============================================
    
    const [ searchParams, setSearchParams ] = useSearchParams()
    let userIds = searchParams.getAll(props.type)

    // ======= Render State =========================================
    
    const [ assigneeSearchString, setAssigneeSearchString ] = useState('')

    // ======= Request Tracking =====================================


    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const journal = useSelector(function(state) {
        if ( state.journals.dictionary[props.id] ) {
            return state.journals.dictionary[props.id]
        } else {
            return null
        }
    })

    const userDictionary = useSelector(function(state) {
        return state.users.dictionary
    })

    // ======= Actions and Event Handling ===========================

    const setUser = function(id) {
        searchParams.append(props.type, id)
        setSearchParams(searchParams)
    }

    const removeUser = function(id) {
        searchParams.delete(props.type)
        for(const uid of userIds) {
            if ( uid != id ) {
                searchParams.append(props.type, uid)
            }
        }
        setSearchParams(searchParams)
    }

    // ======= Effect Handling ======================================


    // ======= Render ===============================================
 

    let selectedContent = ( <Spinner local={true} /> )
    const userViews = []
    for ( const id of userIds ) {
        userViews.push(
            <FloatingMenuItem key={id} onClick={(e) => { e.preventDefault(); removeUser(id); }}  className="selected-user">
                <CheckIcon className="check" /> <UserTag id={id} link={false} /> 
            </FloatingMenuItem>
        )
    }

    selectedContent = (
        <>
            <div className="selected-users">
                { userViews }
            </div>
        </>
    )

    let members = journal.members 
    if ( assigneeSearchString ) {
        members = journal.members.filter(function(m) {
            return userDictionary[m.userId]?.name
                .toLowerCase().includes(assigneeSearchString.toLowerCase())
        })
    } 

    let memberViews = []
    for(const member of members ) {
        if ( props.type == 'editors' && member.permissions == 'reviewer') {
            continue
        }

        if ( userIds.find((id) => id == member.userId)) {
            continue
        }

        memberViews.push(
            <FloatingMenuItem 
                key={member.userId}
                onClick={ 
                    (e) => { e.preventDefault(); e.stopPropagation(); setUser(member.userId) }
                } 
                className="member"
            >
                <UserTag id={member.userId} link={false} />
            </FloatingMenuItem>
        )
    }

    return (
        <FloatingMenu className="assignment-filter-menu">
            <FloatingMenuTrigger>
                Assigned { props.type == 'editors' ? 'Editors' : 'Reviewers' } 
            </FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    <div>
                        <input 
                            type="text" 
                            value={assigneeSearchString}
                            onChange={ (e) => setAssigneeSearchString(e.target.value) }
                            placeholder={`Filter for ${props.type}...`}
                        />
                    </div>
                </FloatingMenuHeader>
                { selectedContent }                 
                { memberViews }    
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default AssignmentFilterMenu 
