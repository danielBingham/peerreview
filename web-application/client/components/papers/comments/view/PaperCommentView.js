import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'


const PaperCommentView = function({ paperCommentId }) {
    
    // ======= Render State =========================================

    // ======= Request Tracking =====================================
  

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paperComment = useSelector(function(state) {
        if ( commentId ) {
            return state.paperComments.dictionary[commentId]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()
    

    // ======= Effect Handling ======================================


    // ======= Render ==============================================

    return (
        <div className="paper-comment-view" >
            <div className="header">
                <UserTag userId={paperComment.userId} /> commented <DateTag timestamp={paperComment.committedDate} />
            </div>
            <div className="content">
                { paperComment.content }
            </div>
        </div>
    )

}

export default PaperCommentView
