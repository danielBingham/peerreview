import React from 'react'
import { useSelector } from 'react-redux'

import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './VisibilityBar.css'

const VisibilityBar = function({ eventId, eventType}) {

    // ============ Redux State ===============================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const event = useSelector(function(state) {
        if ( eventId ) {
            return state.paperEvents.dictionary[eventId]
        }
        return null
    })

    const paper = useSelector(function(state) {
        if ( event ) {
            return state.papers.dictionary[event.paperId]
        }
        return null
    })

    const submission = useSelector(function(state) {
        if ( event ) {
            return state.journalSubmissions.dictionary[event.submissionId]
        }
        return null
    })

    const isAuthor = currentUser && paper && ( paper.authors.find((a) => a.userId == currentUser.id) ? true : false )
    const isMember = currentUser && submission && ( currentUser.memberships.find((m) => m.journalId == submission.journalId) ? true : false)

    // ============ Render ====================================================


    let status = 'base'

    if ( event && ! event.visibility.includes('public' ) ){
        // Authorship takes precedence over editorship when showing danger.
        // So do membership first and override.
        if ( isMember ) {
            status = event.visibility.includes('authors') || event.visibility.includes('corresponding-authors') ? 'danger' : 'safe'
        }

        if ( isAuthor ) {
            status = event.visibility.includes('managing-editors') 
                || event.visibility.includes('editors') || event.visibility.includes('assigned-editors')
                || event.visibility.includes('reviewers') || event.visibility.includes('assigned-reviewers') ? 'danger' : 'safe'
        }
    }

    return (
        <div className={`visibility-bar ${status}`}>
            <VisibilityControl eventId={eventId} eventType={eventType} />
        </div>
    )

}

export default VisibilityBar

