import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'
import UserInput from '/components/users/input/UserInput'

import './SelectCoEditorsWidget.css'

const SelectCoEditorsWidget = function(props) {

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

    const selectEditor = function(user) {
        const newEditors = [ ...props.editors ]

        const editor = {
            userId: user.id,
            permissions: 'editor'
        }

        newEditors.push(editor)
        props.setEditors(newEditors)
    }

    const assignPermissions = function(editor, permissions) {
        editor.permissions = permissions

        const newEditors = props.editors.filter((e) => e.userId != editor.userId)
        newEditors.push(editor)
        props.setEditors(newEditors)
    }

    const removeEditor = function(editor) {
        if ( editor.userId == currentUser.id ) {
            return
        }
           
        const newEditors = props.editors.filter((e) => e.userId != editor.userId)
        props.setEditors(newEditors)
    }

    // ================= Effect Handling =======================
   

    // ====================== Render ==========================================

    const selectedEditorViews = []

    for(const editor of props.editors) {
        selectedEditorViews.push( 
            <div key={editor.userId} className="selected-editor">
                <div className="left">
                    <UserTag id={editor.userId} /> 
                </div>
                <div className="right">
                    <select 
                        onChange={(e) => assignPermissions(editor, e.target.value) } 
                        value={ editor.permissions } name="permissions"
                    > 
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                    </select>
                    { editor.userId != currentUser.id && <a href="" onClick={(e) => { e.preventDefault(); removeEditor(editor) }} ><XMarkIcon  /></a> }
                </div>
            </div>
        )
    }

    return (
        <div className="select-coeditors-widget">
            <UserInput
               label={'Select Co-Editors'}
                explanation={'Select co-editors for your journal.'}
                onBlur={onBlur}
                selectUser={selectEditor}
            />
            <div className="selected-editors">
                {selectedEditorViews}
            </div>
        </div>
    )

}

export default SelectCoEditorsWidget
