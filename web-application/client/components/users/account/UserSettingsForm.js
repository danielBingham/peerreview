import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getFields, cleanupRequest as cleanupFieldsRequest } from '/state/fields'
import { putSetting, cleanupRequest as cleanupSettingsRequest } from '/state/settings'

import FieldsInput from '/components/fields/FieldsInput'

import Spinner from '/components/Spinner'

const UserSettingsForm = function(props) {

    // ====== Render State ==========================================

    const [ignored, setIgnored] = useState([])
    const [isolated, setIsolated] = useState([])

    // ======= Request Tracking =====================================

    const [settingsRequestId, setSettingsRequestId] = useState(null)
    const settingsRequest = useSelector(function(state) {
        if ( settingsRequestId) {
            return state.settings.requests[settingsRequestId]
        } else {
            return null
        }
    })


    const [fieldsRequestId, setFieldsRequestId] = useState(null)
    const fieldsRequest = useSelector(function(state) {
        if ( fieldsRequestId ) {
            return state.fields.requests[fieldsRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const setting = useSelector(function(state) {
        return state.settings.dictionary[currentUser.id]
    })

    const fields = useSelector(function(state) {
        return state.fields.dictionary
    })


    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const onSubmit = function(event) {
        event.preventDefault()

        const newSetting = {
            ...setting
        }
        newSetting.fields = []

        for( const field of ignored ) {
            newSetting.fields.push({
                fieldId: field.id,
                setting: 'ignored'
            })
        }

        for( const field of isolated ) {
            newSetting.fields.push({
                fieldId: field.id,
                setting: 'isolated'
            })
        }

        setSettingsRequestId(dispatch(putSetting(newSetting)))
    }

    const initializeFields = function() {
        const query = {
            ids: []
        }
        if ( setting.fields.length > 0 ) {
            const newIgnored = []
            const newIsolated = []
            for ( const fieldSetting of setting.fields ) {
                if ( fields[fieldSetting.fieldId] ) {
                    if ( fieldSetting.setting == 'ignored') {
                        newIgnored.push(fields[fieldSetting.fieldId])
                    } else if (fieldSetting.setting == 'isolated') {
                        newIsolated.push(fields[fieldSetting.fieldId])
                    }
                } else {
                    query.ids.push(fieldSetting.fieldId)
                }
            }
            setIgnored(newIgnored)
            setIsolated(newIsolated)
        } 
        return query
    }

    // ======= Effect Handling ======================================

    // We're using this to ensure the fields dictionary has the fields we'll
    // need.  TODO This is TECHDEBT.  The Field component can now query for its
    // own field when initialized with an ID, and that's a better solution than
    // this mess.
    useLayoutEffect(function() {
        const query = initializeFields()
        if ( query.ids.length > 0 ) {
            setFieldsRequestId(dispatch(getFields('settings', query)))
        }
    }, [])

    // TODO TECHDEBT we should just be relying on the Field component to query
    // for its own data.
    useLayoutEffect(function() {
        if ( fieldsRequest && fieldsRequest.state == 'fulfilled' ) {
            const query = initializeFields()
            if ( query.ids.length > 0 ) {
                throw new Error('We have a query after running the query. This should not happen.')
            }
        }
    }, [ fieldsRequest] )

    useEffect(function() {
        if ( settingsRequest && settingsRequest.state == 'fulfilled' ) {
            setSettingsRequestId(null)
        }
    }, [ isolated, ignored ])

    useEffect(function() {
        return function cleanup() {
            if ( fieldsRequestId ) {
                dispatch(cleanupFieldsRequest({ requestId: fieldsRequestId }))
            }
        }
    }, [ fieldsRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( settingsRequestId ) {
                dispatch(cleanupSettingsRequest({ requestId: settingsRequestId}))
            }
        }
    }, [ settingsRequestId ])

    let successMessage = null
    if ( settingsRequest && settingsRequest.state == 'fulfilled' ) {
        successMessage = ( <div className="success">Successfully updated field visibility preferences.</div>)
    }

    if ( ! fieldsRequestId || (fieldsRequest && fieldsRequest.state == 'fulfilled')) {
        return (
            <div className="user-settings-form">
                <h2>Settings</h2>
                <form onSubmit={onSubmit}>
                    <div className="isolated">
                        <FieldsInput 
                            fields={isolated} 
                            setFields={setIsolated} 
                            title="Isolated Fields"
                            explanation={`Enter fields that you would like to isolate.  You will only see papers posted in these fields everywhere on the site.  Papers posted in other fields will be ignored.`}
                        />
                    </div>
                    <div className="ignored">
                        <FieldsInput 
                            fields={ignored} 
                            setFields={setIgnored} 
                            title="Ingored Fields"
                            explanation={`Enter fields that you would like to ignore.  You will not see papers posted in these fields anywhere on the site.` }
                        />
                    </div>
                    <div className="submit">
                        <input type="submit" name="submit" value="Update Settings" />
                    </div>
                </form>
                { successMessage }
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default UserSettingsForm
