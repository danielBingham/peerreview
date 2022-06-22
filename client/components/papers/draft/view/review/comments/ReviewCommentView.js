import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getUser, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import Spinner from '/components/Spinner'
import './ReviewCommentView.css'

const ReviewCommentView = function(props) {

    return (
        <div key={props.comment.id} id={props.comment.id} className="comment-outer">
            <UserTag id={props.comment.userId} />
            <div className="datetime">{props.comment.updatedDate}</div>
            <div className="comment-inner" style={{ padding: '5px' }} >
                {props.comment.content}
            </div>
        </div>
    )
}
export default ReviewCommentView
