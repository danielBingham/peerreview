import React from 'react'
import { useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'

import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'

import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperCommentView.css'

const PaperCommentView = function({ paperCommentId, eventId }) {
    
    // ======= Render State =========================================

    // ======= Request Tracking =====================================
  

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paperComment = useSelector(function(state) {
        if ( paperCommentId ) {
            return state.paperComments.dictionary[paperCommentId]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================
    

    // ======= Effect Handling ======================================


    // ======= Render ==============================================

    return (
        <div className="paper-comment-view" >
            <div className="header">
                <div className="left"><UserTag id={paperComment.userId} /> commented <a href={`/paper/${paperComment.paperId}/timeline#comment-${paperComment.id}`}><DateTag timestamp={paperComment.committedDate} /></a></div>
                <div className="right"><VisibilityControl eventId={eventId} /></div>
            </div>
            <div className="content">
                <ReactMarkdown>{ paperComment.content }</ReactMarkdown>
            </div>
        </div>
    )

}

export default PaperCommentView
