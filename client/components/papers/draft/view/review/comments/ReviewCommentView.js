import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'

import { getUser, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import './ReviewCommentView.css'

const ReviewCommentView = function(props) {

    // ======= Render ===============================================

    return (
        <div key={props.comment.id} id={props.comment.id} className="comment-outer">
            <div className="profile-picture"></div>
            <UserTag id={props.comment.userId} />
            <div className="datetime"><DateTag timestamp={props.comment.updatedDate} /></div>
            <div className="comment-inner" style={{ padding: '5px' }} >
                <ReactMarkdown>
                    {props.comment.content}
                </ReactMarkdown>
            </div>
        </div>
    )
}
export default ReviewCommentView
