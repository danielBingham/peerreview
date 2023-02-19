import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { clearList, countPapers, getPapers, cleanupRequest } from '/state/papers'
import { countReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Spinner from '/components/Spinner'
import PaginationControls from '/components/PaginationControls'

import DraftPapersListItemView from './DraftPapersListItemView'

import './DraftPapersListView.css'

/**
 * Render a list of draft papers belonging to the logged in user.
 * 
 * Must be logged in to view.
 *
 * TODO Refactor this to render drafts of papers and to take a query in props
 * so that we can reuse it for both the "reviews" page and the "my drafts"
 * page.
 *
 * @param {object} props    Standard react props object - empty.
 */
const DraftPapersListView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId) {
            return state.papers.requests[requestId]
        } else {
            return null
        }
    })

    const [countRequestId, setCountRequestId ] = useState(null)
    const countRequest = useSelector(function(state) {
        if (countRequestId) {
            return state.papers.requests[countRequestId]
        } else {
            null
        }
    })

    const [countReviewsRequestId, setCountReviewsRequestId] = useState(null)
    const countReviewsRequest = useSelector(function(state) {
        if ( countReviewsRequestId) {
            return state.reviews.requests[countReviewsRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const paperList = useSelector(function(state) {
        return state.papers.list
    })

    const counts = useSelector(function(state) {
        return state.papers.counts 
    })
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    const queryForPapers = function({searchString, sortBy, page}) {
        let query = {}
        if ( props.query ) {
            query = {
                ...props.query
            }
        }

        if ( searchString ) {
            query.searchString = searchString
        }

        if ( props.authorId ) {
            query.authorId = props.authorId
        }

        query.isDraft = true 

        if ( ! sortBy ) {
            query.sort = 'newest'
        } else {
            query.sort = sortBy
        }

        if ( ! page ) {
            query.page = 1
        } else {
            query.page = page
        }

        setCountRequestId(dispatch(countPapers(query, true)))
        setRequestId(dispatch(getPapers(query, true)))
        setCountReviewsRequestId(dispatch(countReviews()))
    }

    // Our request is dependent on the searchParams, so whenever they change we
    // need to make a new request.
    useEffect(function() {
        const params = {
            searchString: searchParams.get('q'),
            sortBy: searchParams.get('sort'),
            page: searchParams.get('page')
        }
        queryForPapers(params)
    }, [searchParams])

    // Logging out doesn't always unmount the component.  When that happens, we
    // can end up in a state where we have a requestId, but don't have a
    // request.  If that happens, we need to make a new request, because we
    // really don't want to be in that state.
    useEffect(function() {
        if ( requestId && ! request ) {
            const params = {
                searchString: searchParams.get('q'),
                sortBy: searchParams.get('sort'),
                page: searchParams.get('page')
            }
            queryForPapers(params)
        }
    }, [ request ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( countRequestId ) {
                dispatch(cleanupRequest({requestId: countRequestId}))
            }
        }
    }, [ countRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( countReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: countReviewsRequestId }))
            }
        }
    }, [ countReviewsRequestId ])

    // ====================== Render ==========================================

    // Don't render unless we've completed the request, otherwise we could wind
    // up rendering a list generated by a different request.

    let content = ( <Spinner /> )
    if ( request && request.state == 'fulfilled' && countReviewsRequest && countReviewsRequest.state == 'fulfilled') {
        content = []
        for (const paper of paperList) {
            content.push(<DraftPapersListItemView paper={paper} key={paper.id} />)
        }

        if ( content.length <= 0 ) {
            content =  (<div className="empty-search">No papers to list.</div>)
        }
    } else if (request && request.state == 'failed') {
        content = ( <div className="error">Attempt to retrieve drafts failed with error: { request.error }.  Please report this as a bug.</div> ) 
    }

    const newestParams = new URLSearchParams(searchParams.toString())
    newestParams.set('sort', 'newest')

    const activeParams = new URLSearchParams(searchParams.toString())
    activeParams.set('sort', 'active')

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'newest'

    return (
        <section className="draft-paper-list">
            <div className="header">
                <h2>Draft Papers</h2>
                <div className="controls">
                    <div className="sort">
                        <a href={`?${newestParams.toString()}`} 
                            onClick={(e) => { e.preventDefault(); setSort('newest')}} 
                            className={( sort == 'newest' ? 'selected' : '' )} >Newest</a>
                        <a href={`?${activeParams.toString()}`} 
                            onClick={(e) => { e.preventDefault(); setSort('active')}} 
                            className={( sort == 'active' ? 'selected' : '' )} >Active</a>
                    </div>
                </div>
            </div>
            <div>
                { content }
            </div>
            <PaginationControls counts={counts} />
        </section>
    )

}

export default DraftPapersListView 
