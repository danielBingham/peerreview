import React, { useLayoutEffect }  from 'react'
import { useSelector } from 'react-redux'

import { useSearchParams } from 'react-router-dom'

import './ReviewCommentThreadPinView.css'

const ReviewCommentThreadPinView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // We need the thread to update based on changes to the redux store. For
    // some reason, even though we pull it from the redux store in
    // DraftPaperPDFView, that's not triggering the ThreadView to re-render
    // appropriately.  This does.
    const thread = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.reviewId].threads.find((t) => t.id == props.id)
    })

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][thread.reviewId]
    })

    // ======= Actions and Event Handling ===========================

    const pinClicked = function(event) {
        searchParams.set('thread', thread.id)
        setSearchParams(searchParams)
    }

    useLayoutEffect(function() {
        if ( searchParams.get('thread') == thread.id ) {
            props.scrollToPin(thread.pinY)
        }
    }, [ searchParams ])


    // ======= Rendering ============================================

    const selected = searchParams.get('thread') == thread.id 
    return (
        <div 
            className={( selected ? "comment-thread-pin selected" : "comment-thread-pin ")} 
            onClick={pinClicked} 
            style={{ 
                top: parseInt(thread.pinY*props.height)+ 'px', 
                left: parseInt(thread.pinX*props.width)+ 'px' 
            }}
        >
        </div> 
    )
}

export default ReviewCommentThreadPinView
