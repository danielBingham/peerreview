import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { clearList, getPapers, cleanupRequest } from '/state/papers'

import Spinner from '/components/Spinner'

import PublishedPaperListItem from './PublishedPaperListItem'

import './PublishedPaperList.css'


/**
 * A list displaying the papers that have been posted. 
 *
 * @param {object} props - An empty object, takes no props.
 */
const PublishedPaperList = function(props) { 
    const [requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const paperList = useSelector(function(state) {
        return state.papers.list
    })

    const request = useSelector(function(state) {
        if (requestId) {
            return state.papers.requests[requestId]
        } else {
            null
        }
    })

    useEffect(function() {
        if ( ! requestId ) {
            dispatch(clearList())
            setRequestId(dispatch(getPapers({ isDraft: false })))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(requestId))
            }
        }
    }, [ requestId, request ])

    // ====================== Render ==========================================
    if ( request && request.state == 'fulfilled') { 

        const listItems = []
        for (const paper of paperList) {
            listItems.push(<PublishedPaperListItem paper={paper} key={paper.id} />)
        }

        return (
            <section className="paper-list">
                <div className="error"> {request && request.error} </div>
                <div>
                    {listItems}
                </div>
            </section>
        )
    } else {
        // Show a spinner if we haven't made the request yet or the request is not
        // fulfilled. 
        return (
            <Spinner />
        )
    }
}

export default PublishedPaperList 
