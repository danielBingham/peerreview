import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postResponses, cleanupRequest } from '/state/responses'

import './ResponseForm.css'

const ResponseForm = function(props) {
    const [content, setContent] = useState('')

    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()

    const onSubmit = function(event) {
        event.preventDefault() 

        const response = {
            paperId: props.paper.id,
            userId: props.currentUser.id,
            versions: [
                {
                    content: content
                }
            ]
        }

        setRequestId(dispatch(postResponses(response)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <div className="paper-response-form">
            <form onSubmit={onSubmit}>
                <div className="field-wrapper content">
                    <textarea 
                        name="content" 
                        placeholder="Write a response..."
                        value={content} 
                        onChange={(e) => setContent(e.target.value)}
                    >
                    </textarea>
                </div>
                <div className="submit">
                    <input type="submit" name="submit" value="Submit Response" />
                </div>
            </form>
        </div>
    )

}

export default ResponseForm
