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

    console.log(`\n\n### PublishedPaperList ###`)
    console.log(props)
    console.log('RequestId')
    console.log(requestId)

    const dispatch = useDispatch()

    const paperList = useSelector(function(state) {
        return state.papers.list
    })
    console.log('paperList')
    console.log(paperList)

    const request = useSelector(function(state) {
        if (requestId) {
            return state.papers.requests[requestId]
        } else {
            null
        }
    })
    console.log('Request')
    console.log(request)

    useEffect(function() {
        console.log(`=== PublishedPaperList.EFFECT - props.query ===`)
        if ( ! requestId ) {
            let query = {}
            if ( props.query ) {
                query = { ...props.query }
            }
            query.isDraft = false

            dispatch(clearList())
            setRequestId(dispatch(getPapers(query)))
        }
        console.log(`=== END PublishedPaperList.EFFECT - props.query ===`)

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(requestId))
            }
        }
    }, [ props.query ])

    // ====================== Render ==========================================
    console.log(`=== PublishedPaperList.RENDERING ===`)
    console.log(paperList)
    if ( request && request.state == 'fulfilled') { 

        let listItems = []
        for (const paper of paperList) {
            listItems.push(<PublishedPaperListItem paper={paper} key={paper.id} />)
        }

        if ( listItems.length == 0 ) {
            listItems = ( <div className="empty-search">No published papers to display.</div>)
        }

        return (
            <section className="published-paper-list">
                <div className="error"> {request && request.error} </div>
                <div className="header">
                    <h2>Published Papers</h2>
                    <div className="controls">
                        <div className="sort">
                            <div>Newest</div>
                            <div>Active</div>
                        </div>
                    </div>
                </div>
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
