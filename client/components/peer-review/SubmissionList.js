import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUserPapers, cleanupRequest } from '../../state/users'

import Spinner from '../Spinner'

const SubmissionList = function(props) {
    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })


    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    useEffect(function() {
        if ( currentUser && ! request ) {
            setRequestId(dispatch(getUserPapers(currentUser.id)))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(requestId))
            }
        }
    }, [ currentUser, request ])

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
                <section id="search">
                    <div>Search: _________________</div>
                    <div>Or Browse: <Link to="/fields">fields</Link>&nbsp;<Link to="/users">users</Link></div>
                </section>
                <section id="filters">
                    <h2>Filters</h2>
                    <section id="only-fields">
                        Show Only Fields: ______________
                    </section>
                    <section id="highlight-fields">
                        Highlight Fields: _______________
                    </section>
                    <section id="ignore-fields">
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

export default ViewSubmission
