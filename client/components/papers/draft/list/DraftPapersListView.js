import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUserPapers, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import DraftPapersListItemView from './DraftPapersListItemView'

const DraftPapersListView = function(props) {
    const [userPapersRequestId, setUserPapersRequestId] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const userPapersRequest = useSelector(function(state) {
        return state.authentication.requests[userPapersRequestId]
    })

    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    useEffect(function() {
        if ( currentUser && ! userPapersRequestId ) {
            setUserPapersRequestId(dispatch(getUserPapers(currentUser.id)))
        }

        return function cleanup() {
            if ( userPapersRequest ) {
                dispatch(cleanupRequest(userPapersRequest))
            }
        }
    }, [ currentUser ])

    // ====================== Render ==========================================

    if ( ! currentUser || ( userPapersRequest && userPapersRequest.state !== 'fulfilled') ) {
        return (
            <Spinner />
        )
    } else {
        const listItems = []
        for (let id in currentUser.papers) {
            listItems.push(<DraftPapersListItemView paper={currentUser.papers[id]} key={id} />)
        }

        return (
            <section className="draft-paper-list">
                {listItems}
            </section>
        )
    }

}

export default DraftPapersListView 
