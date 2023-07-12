import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { postJournals, cleanupRequest } from '/state/journals'

import SelectCoEditorsWidget from '/components/journals/widgets/SelectCoEditorsWidget'
import Spinner from '/components/Spinner'

import './CreateJournalForm.css'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const CreateJournalForm = function(props) { 

    // ================ Render State ================================
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [editors, setEditors] = useState([])

    const [nameError, setNameError] = useState(null)
    const [descriptionError, setDescriptionError] = useState(null)
    const [editorsError, setEditorsError] = useState(null)

    // ================== Request Tracking ====================================
    
    const [postJournalsRequestId, setPostJournalsRequestId] = useState(null)
    const postJournalsRequest = useSelector(function(state) {
        if (postJournalsRequestId) {
            return state.journals.requests[postJournalsRequestId]
        } else {
            return null
        }
    })

    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     *
     */
    const isValid = function(formFieldName) {
        let error = false

        if ( ! formFieldName || formFieldName == 'name' ) {
            if (name.length <= 0) {
                setNameError('no-name')
                error = true
            } else if ( nameError) {
                setNameError(null)
            }
        }

        if ( ! formFieldName || formFieldName == 'editors' ) {
            if ( editors.length <= 0 ) {
                setEditorsError('no-editors')
            }

            let haveOwner = false
            for(const editor of editors ) {
                if ( editor.permissions == 'owner' ) {
                    haveOwner = true
                }
            }
            if ( ! haveOwner ) {
                setEditorsError('no-owner')
            }

        }

        return ! error
    }

    /**
     * Handle the form's submission by attempting to post the journal.  Store the
     * postJournalsRequestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        if ( ! isValid() ) {
            return false
        }

        const journal = {
            name: name,
            description: description,
            editors: editors
        }
        setPostJournalsRequestId(dispatch(postJournals(journal)))

        return false
    }


    // ================= Effect Handling =======================
    
    useLayoutEffect(function() {
        const newEditors = [ {
            userId: currentUser.id,
            permissions: 'owner'
        }]
        setEditors(newEditors)
    }, [])

    useEffect(function() {
        if ( postJournalsRequest && postJournalsRequest.state == 'fulfilled') {
            const path = "/journal/" + postJournalsRequest.result.id
            navigate(path)
        }
    }, [ postJournalsRequest] )

    useEffect(function() {
        return function cleanup() {
            if ( postJournalsRequestId ) {
                dispatch(cleanupRequest({ requestId: postJournalsRequestId }))
            }
        }
    }, [ postJournalsRequestId]) 


    // ====================== Render ==========================================

    let requestError = null 
    if ( postJournalsRequest && postJournalsRequest.state == 'failed') {
        let errorContent = 'Something went wrong.' 

        requestError = (
            <div className="overall-error">
                { errorContent }
            </div>
        )
    }


    let nameErrorView = null

    if ( nameError && nameError == 'no-name' ) {
        nameErrorView = ( <div className="error">Must include a name.</div> )
    }

    let spinning = null
    if ( postJournalsRequest && postJournalsRequest.state == 'pending') {
        spinning = ( <Spinner local={true} /> )
    }

    return (
        <div className="create-journal-form">
            <h2>Create a new Journal</h2>
            <form onSubmit={onSubmit}>

                <div className="name field-wrapper">
                    <label htmlFor="name">Name</label>
                    <div className="explanation">Enter the name of your journal.</div>
                    <input type="text" 
                        name="name" 
                        value={name}
                        onBlur={ (event) => isValid('name') }
                        onChange={ (event) => setName(event.target.value) } 
                    />
                    { nameErrorView }
                </div>

                <div className="description field-wrapper">
                    <label htmlFor="description">Description</label>
                    <div className="explanation">Enter a description for your journal.</div>
                    <textarea 
                        name="description" 
                        value={description}
                        onBlur={ (event) => isValid('description') }
                        onChange={ (event) => setDescription(event.target.value) } 
                    />
                </div>

                <SelectCoEditorsWidget editors={editors} setEditors={setEditors} />

                { requestError }
                <div className="submit field-wrapper">
                    { spinning && spinning }
                    { ! spinning && <input type="submit" name="create-journal" value="Create Journal" /> }
                </div>
            </form>
        </div>
    )
}

export default CreateJournalForm 
