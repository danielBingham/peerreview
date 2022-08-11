import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { getUser, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import './ReviewCommentView.css'

const ReviewCommentView = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const goToReview = function(event) {
        event.preventDefault()
        event.stopPropagation()
        searchParams.set('review', props.review.id)
        searchParams.set('thread', props.thread.id)
        setSearchParams(searchParams)
    }

    const goToComment = function(event) {
        event.preventDefault()
        event.stopPropagation()
        searchParams.set('thread', props.thread.id)
        setSearchParams(searchParams)
    }


    // ======= Render ===============================================

    return (
        <div key={props.comment.id} id={props.comment.id} className="comment-outer">
            <div className="profile-picture"></div>
            <UserTag id={props.comment.userId} />
            <div className="datetime">posted <a onClick={goToComment} href={`?review=${props.review.id}&thread=${props.thread.id}`}><DateTag timestamp={props.comment.updatedDate} /></a> in <a onClick={goToReview} href={`?review=${props.review.id}&thread=${props.thread.id}`}>review #{props.review.id}</a></div>
            <div className="comment-inner" style={{ padding: '5px' }} >
                <ReactMarkdown>
                    {props.comment.content}
                </ReactMarkdown>
            </div>
        </div>
    )
}
export default ReviewCommentView
