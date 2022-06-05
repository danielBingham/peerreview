import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getPapers, cleanupRequest } from '../state/papers'

import Spinner from './Spinner'

const PaperListItem = function(props) {
    const paper = props.paper

    let authorList = ''
    for (let i = 0; i < paper.authors.length; i++) {
        authorList += paper.authors[i].user.name 
        if (i < paper.authors.length-1) {
            authorList += ', '
        }
    }

    return (
        <li id={paper.id} >[{Math.floor(Math.random() * 100)} votes] [{Math.floor(Math.random()*10)} responses] {paper.title} by {authorList} [physics] [particle-physics]</li>
    )
}

/**
 * A list displaying the papers that have been posted. 
 *
 * @param {object} props - An empty object, takes no props.
 */
const PaperList = function(props) { 
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
            listItems.push(<PaperListItem paper={papers[id]} key={id} />)
        }

        return (
            <section className="paper-list">
                <section className="search">
                    <div>Search: <input type="text" name="search" /></div>
                </section>
                <section className="filters">
                    <h2>Filters</h2>
                    <section className="only-fields">
                        Show Only Fields: ______________
                    </section>
                    <section className="highlight-fields">
                        Highlight Fields: _______________
                    </section>
                    <section className="ignore-fields">
                        Ignore Fields: ________________
                    </section>
                </section>
                <div className="error"> {request && request.error} </div>
                <ul>
                    {listItems}
                </ul>
            </section>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default PaperList 
