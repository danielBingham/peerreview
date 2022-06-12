import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getPapers, cleanupRequest } from '/state/papers'

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

    const papers = useSelector(function(state) {
        return state.papers.dictionary
    })

    const request = useSelector(function(state) {
        if (requestId) {
            return state.papers.requests[requestId]
        } else {
            null
        }
    })

    useEffect(function() {
        if ( ! requestId && ! request ) {
            setRequestId(dispatch(getPapers()))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(requestId))
            }
        }
    }, [ requestId, request ])

    // ====================== Render ==========================================

    // Show a spinner if the request we made is still in progress.
    if (request && request.state == 'pending') {
        return (
            <Spinner />
        )
    } else if (request && request.state == 'fulfilled') {

        const listItems = []
        for (let id in papers) {
            listItems.push(<PublishedPaperListItem paper={papers[id]} key={id} />)
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
        return (
            <Spinner />
        )
    }
}

export default PublishedPaperList 
