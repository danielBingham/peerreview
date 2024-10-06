import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, BookOpenIcon, LockOpenIcon, LockClosedIcon } from '@heroicons/react/24/outline'

import { refreshAuthentication } from '/state/authentication'
import { postJournals, cleanupRequest } from '/state/journals'

import AddJournalMembersWidget from '/components/journals/widgets/AddJournalMembersWidget'
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
    const [members, setMembers] = useState([])
    const [model, setModel] = useState('public')

    const [nameError, setNameError] = useState(null)
    const [descriptionError, setDescriptionError] = useState(null)
    const [membersError, setMembersError] = useState(null)

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

        if ( ! formFieldName || formFieldName == 'members' ) {
            if ( members.length <= 0 ) {
                setMembersError('no-members')
            }

            let haveOwner = false
            for(const member of members ) {
                if ( member.permissions == 'owner' ) {
                    haveOwner = true
                }
            }
            if ( ! haveOwner ) {
                setMembersError('no-owner')
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
            members: members,
            model: model
        }
        setPostJournalsRequestId(dispatch(postJournals(journal)))

        return false
    }


    // ================= Effect Handling =======================
    
    useLayoutEffect(function() {
        const newMembers = [ {
            userId: currentUser.id,
            order: 1,
            permissions: 'owner'
        }]
        setMembers(newMembers)
    }, [])

    useEffect(function() {
        if ( postJournalsRequest && postJournalsRequest.state == 'fulfilled') {
            dispatch(refreshAuthentication())
            const path = "/journal/" + postJournalsRequest.result.entity.id
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

                <AddJournalMembersWidget members={members} setMembers={setMembers} />

                <div className="model field-wrapper">
                    <label htmlFor="model">Select a Model</label>
                    <div className="explanation">Choose an operating model for your journal.</div>
                    <div className="model-wrapper">
                        <div className="model-option">
                            <input 
                                type="radio" 
                                name="model" 
                                checked={ model == 'public' }
                                onChange={(e) => setModel('public')}
                                value="public" />
                            <label htmlFor="public" onClick={(e) => setModel('public')}><GlobeAltIcon/>Public</label>
                            <div className="explanation">A journal that operates entirely transparently.  Everything will be public.</div>
                        </div>
                        <div className="model-option">
                            <input 
                                type="radio" 
                                name="model" 
                                checked={ model == 'open-closed' }
                                onChange={(e) => setModel('open-closed')}
                                value="open-closed" />
                            <label htmlFor="open-closed" onClick={(e) => setModel('open-closed')}><LockOpenIcon/>Open</label>
                            <div className="explanation">Unpublished submissions are viewable to the journal's membership, allowing for a high-trust self-organizing journal.  Publishing doesn't change visibility.</div>
                        </div>
                        <div className="model-option">
                            <input 
                                type="radio" 
                                name="model" 
                                checked={ model == 'closed' }
                                onChange={(e) => setModel('closed')}
                                value="closed" />
                            <label htmlFor="closed" onClick={(e) => setModel('closed')}><LockClosedIcon/>Closed</label>
                            <div className="explanation">The traditional closed journal model.  Submissions are viewable by managing editors, assigned editors, and assigned reviewers.</div>
                        </div>
                    </div>
                </div>

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
