import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postResponses, cleanupRequest } from '/state/responses'

import './ResponseForm.css'

const ResponseForm = function(props) {
    
    // ======= Render State ==========================================
   
    const [content, setContent] = useState('')
    const [ vote, setVote ] = useState(0)

    const [ lengthError, setLengthError] = useState(false)

    // ======= Redux State ==========================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.responses.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    const onSubmit = function(event) {
        event.preventDefault() 

        if (( vote == 1 || vote == -1) && content.split(/\s/).length < 125) {
            setLengthError(true)        
            return
        }

        const response = {
            paperId: props.paper.id,
            userId: props.currentUser.id,
            vote: vote,
            versions: [
                {
                    vote: vote,
                    content: content
                }
            ]
        }

        setRequestId(dispatch(postResponses(response)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Rendering ======================================
   
    let error = null
    if ( lengthError ) {
        error = (
            <span className="length-error">You must submit a response of at least 250 words in order to endorse.</span>
        )
    }

    let length = content.split(/\s/).length - 1
    let wordsLeft = (
        <span className="words-left">You have entered { length } of 125 words required to submit an endorsement with this response.</span>
    )

    let voteView = ''
    if (vote == 1 ) {
        voteView = 'Endorsed'
    } else if ( vote == -1 ) {
        voteView = 'Refuted'
    } else {
        voteView = 'Neutral'
    }

    return (
        <div className="paper-response-form">
            <div className="vote-widget">
                <button
                    onClick={(e) => vote == 1 ? setVote(0) : setVote(1)} 
                >
                    Endorse
                </button>
                <div>
                    { voteView }            
                </div>
                <button
                    onClick={(e) => vote == -1 ? setVote(0) : setVote(-1) } 
                >
                    Refute
                </button> 
            </div>
            <div className="response-wrapper">
                <div className="error"> { error } </div>
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
                    <div className="word-count">
                        { wordsLeft }
                    </div>
                    <div className="submit">
                        <input type="submit" name="submit" value="Submit Response" />
                    </div>
                </form>
            </div>
        </div>
    )

}

export default ResponseForm
