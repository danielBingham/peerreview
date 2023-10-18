import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

import { updatePaperComment, deletePaperComment, cleanupRequest } from '/state/paperComments'

import DateTag from '/components/DateTag'
import AreYouSure from '/components/AreYouSure'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import UserTag from '/components/users/UserTag'
import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperCommentView.css'

const PaperCommentView = function({ paperCommentId, eventId }) {
    
    // ======= Render State =========================================

    const [ areYouSure, setAreYouSure ] = useState(false)
    
    // ======= Request Tracking =====================================
  
    const [patchCommentRequestId, setPatchCommentRequestId] = useState(null)
    const patchCommentRequest = useSelector(function(state) {
        if ( patchCommentRequestId ) {
            return state.reviews.requests[patchCommentRequestId]
        } else {
            return null
        }

    })

    const [deleteCommentRequestId, setDeleteCommentRequestId] = useState(null)
    const deleteCommentRequest = useSelector(function(state) {
        if ( deleteCommentRequestId ) {
            return state.reviews.requests[deleteCommentRequestId]
        } else {
            return null
        }
    })

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
    
    const dispatch = useDispatch()

    const edit = function(event) {
        event.preventDefault()
        
        if ( paperComment.status !== 'committed' ) {
            return
        }

        const comment = {
            id: paperComment.id,
            status: 'edit-in-progress' 
        }
        
        setPatchCommentRequestId(dispatch(updatePaperComment(comment)))
    }

    const deleteComment = function(event) {
        event.preventDefault()
        event.stopPropagation()

        setDeleteCommentRequestId(dispatch(deletePaperComment(paperComment.id)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( patchCommentRequestId ) {
                dispatch(cleanupRequest({ requestId: patchCommentRequestId }))
            }
        }
    }, [ patchCommentRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( deleteCommentRequestId) {
                dispatch(cleanupRequest({ requestId: deleteCommentRequestId }))
            }
        }
    }, [ deleteCommentRequestId ] )

    // ======= Render ==============================================

    return (
        <>
            <AreYouSure 
                isVisible={areYouSure} 
                action="delete this comment" 
                execute={deleteComment} 
                cancel={() => setAreYouSure(false)} 
            /> 
            <div className="paper-comment-view" >
                <div className="header">
                    <div className="left"><UserTag id={paperComment.userId} /> commented <a href={`/paper/${paperComment.paperId}/timeline#comment-${paperComment.id}`}><DateTag timestamp={paperComment.committedDate} /></a></div>
                    <div className="right">
                        <VisibilityControl eventId={eventId} />
                        { currentUser && currentUser.id == paperComment.userId && <FloatingMenu className="dots-menu">
                            <FloatingMenuTrigger className="dots" showArrow={false}><EllipsisHorizontalIcon /></FloatingMenuTrigger>
                            <FloatingMenuBody>
                                <FloatingMenuItem onClick={edit} className="edit">edit</FloatingMenuItem> 
                                <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete">delete</FloatingMenuItem>
                            </FloatingMenuBody>
                        </FloatingMenu> }
                    </div>
                </div>
                <div className="content">
                    <ReactMarkdown>{ paperComment.content }</ReactMarkdown>
                </div>
            </div>
        </>
    )

}

export default PaperCommentView
