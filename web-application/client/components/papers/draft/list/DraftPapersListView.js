import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { DocumentIcon, InboxIcon } from '@heroicons/react/24/outline'

import { getPapers, clearPaperQuery, cleanupRequest } from '/state/papers'
import { countReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Spinner from '/components/Spinner'
import { FloatingMenu, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import { 
    List, 
    ListHeader, 
    ListTitle, 
    ListControls, 
    ListControl, 
    ListRowContent, 
    ListNoContent 
} from '/components/generic/list/List'
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

    const [countReviewsRequestId, setCountReviewsRequestId] = useState(null)
    const countReviewsRequest = useSelector(function(state) {
        if ( countReviewsRequestId) {
            return state.reviews.requests[countReviewsRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const paperQuery = useSelector(function(state) {
        return state.papers.queries['DraftPapersListView']
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

        if ( props.type ) {
            query.type = props.type
        } else {
            query.type = "preprint"
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

        setRequestId(dispatch(getPapers('DraftPapersListView', query, true)))
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
    }, [searchParams, props.type])

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

    useEffect(function() {
        return function cleanup() {
            dispatch(clearPaperQuery({ name: 'DraftPapersListView' }))
        }
    }, [])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

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
    let noContent = null
    if ( request && request.state == 'fulfilled' && countReviewsRequest && countReviewsRequest.state == 'fulfilled') {
        content = []
        for (const paper of paperQuery.list) {
            content.push(<DraftPapersListItemView paper={paper} key={paper.id} />)
        }

        if ( content.length <= 0 ) {
            content = null
            noContent =  (<div className="empty-search">No papers to list.</div>)
        }
    } else if (request && request.state == 'failed') {
        content = null
        noContent = ( <div className="error">Attempt to retrieve drafts failed with error: { request.error }.  Please report this as a bug.</div> ) 
    }

    const newestParams = new URLSearchParams(searchParams.toString())
    newestParams.set('sort', 'newest')

    const activeParams = new URLSearchParams(searchParams.toString())
    activeParams.set('sort', 'active')

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'newest'

    let title = "Draft Papers"
    if ( props.type == 'preprint') {
        title = (<><DocumentIcon/>Preprints</>)
    } else if ( props.type == 'drafts' ) {
        title = (<><DocumentIcon/>My Drafts</>)
    } else if ( props.type == 'submissions' ) {
        title = (<><InboxIcon/>Submissions</>)
    } else if ( props.type == 'assigned-review' ) {
        title =(<><InboxIcon />Assigned to Me</>)
    }

    return (
        <List>
            <ListHeader>
                <ListTitle>{ title }</ListTitle>
                <ListControls>
                    { props.type != 'preprint' && 
                        <ListControl>
                            <FloatingMenu>
                                <FloatingMenuTrigger>Status</FloatingMenuTrigger>
                                <FloatingMenuBody>
                                    <FloatingMenuItem>Under Construction</FloatingMenuItem>
                                </FloatingMenuBody>
                            </FloatingMenu> 
                        </ListControl>}
                    { (props.type !== 'preprint' ) &&
                    <ListControl>
                        <FloatingMenu>
                            <FloatingMenuTrigger>Journals</FloatingMenuTrigger>
                            <FloatingMenuBody>
                                <FloatingMenuItem>Under Construction</FloatingMenuItem>
                            </FloatingMenuBody>
                        </FloatingMenu>
                    </ListControl>}
                    <ListControl>
                        <FloatingMenu>
                            <FloatingMenuTrigger>Authors</FloatingMenuTrigger>
                            <FloatingMenuBody>
                                <FloatingMenuItem>Under Construction</FloatingMenuItem>
                            </FloatingMenuBody>
                        </FloatingMenu>
                    </ListControl>
                    <ListControl>
                        <FloatingMenu>
                            <FloatingMenuTrigger>Taxonomy</FloatingMenuTrigger>
                            <FloatingMenuBody>
                                <FloatingMenuItem>Under Construction</FloatingMenuItem>
                            </FloatingMenuBody>
                        </FloatingMenu>
                    </ListControl>
                    <ListControl>
                        <FloatingMenu closeOnClick={true}>
                            <FloatingMenuTrigger>Sort: { sort }</FloatingMenuTrigger>
                            <FloatingMenuBody>
                                <FloatingMenuItem>
                                    <a 
                                        url={`?${newestParams.toString()}`}
                                        onClick={(e) => {e.preventDefault();  setSort('newest')}}
                                    >
                                        Newest
                                    </a>
                                </FloatingMenuItem>
                                <FloatingMenuItem>
                                    <a 
                                        url={`?${activeParams.toString()}`} 
                                        onClick={(e) => {e.preventDefault();  setSort('active')}} 
                                    >
                                        Active
                                    </a>
                                </FloatingMenuItem>
                            </FloatingMenuBody>
                        </FloatingMenu>
                    </ListControl>
                </ListControls>
            </ListHeader>
            <ListNoContent>
                {noContent}
            </ListNoContent>
            <ListRowContent>
                { content }
            </ListRowContent>
            <PaginationControls meta={paperQuery?.meta} />
        </List>
    )

}

export default DraftPapersListView 
