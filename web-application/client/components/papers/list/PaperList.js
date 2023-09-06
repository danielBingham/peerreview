import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useSearchParams, Link } from 'react-router-dom'

import { DocumentIcon, DocumentCheckIcon, InboxIcon } from '@heroicons/react/24/outline'

import { getPapers, clearPaperQuery, cleanupRequest } from '/state/papers'
import { countResponses, cleanupRequest as cleanupResponseRequest } from '/state/responses'

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

import JournalFilterMenu from './controls/JournalFilterMenu'
import AuthorFilterMenu from './controls/AuthorFilterMenu'
import SubmissionStatusFilterMenu from './controls/SubmissionStatusFilterMenu' 
import FieldFilterMenu from './controls/FieldFilterMenu'
import SortControl from './controls/SortControl'

import DraftPapersListItemView from '/components/papers/list/DraftPapersListItemView'
import PublishedPaperListItem from '/components/papers/list/PublishedPaperListItem'

import './PaperList.css'

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
const PaperList = function(props) {
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

    const [responseRequestId, setResponseRequestId ] = useState(null)
    const responseRequest = useSelector(function(state) {
        if (responseRequestId) {
            return state.responses.requests[responseRequestId]
        } else {
            null
        }
    })

    // ======= Redux State ==========================================

    const paperQuery = useSelector(function(state) {
        return state.papers.queries['PaperList']
    })
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    const queryForPapers = function({searchString, fields, status, authors, journals, sortBy, page}) {
        let query = { }

        // Make sure we capture the filters from props.
        if ( props.fields ) {
            query.fields = props.fields
        } 
        if ( props.status ) {
            query.status = props.status
        }
        if ( props.authors) {
            query.authors = props.authors
        }
        if ( props.journals ) {
            query.journals = props.journals
        }
   
        // Then merge them with the filters from the searchString.  Props
        // override.
        if ( fields.length > 0 ) {
            if ( query.fields ) {
                query.fields = [ ...fields, ...query.fields ]
            } else {
                query.fields = fields
            }
        }

        if ( status.length > 0 ) {
            if ( query.status ) {
                query.status = [ ...status, ...query.status ]
            } else {
                query.status = status
            }
        }

        if ( authors && authors.length > 0 ) {
            if ( query.authors ) {
                query.authors = [ ...authors, ...query.authors ]
            } else {
                query.authors = authors
            }
        }

        if ( journals && journals.length > 0) {
            if ( query.journals ) {
                query.journals = [ ...journals, ...query.journals ]
            } else {
                query.journals = journals
            }
        }

        if ( searchString ) {
            query.searchString = searchString
        }

        if ( props.type ) {
            query.type = props.type
        } else {
            query.type = "preprint"
        }

        if ( props.type == 'published' ) {
            query.isDraft = false
        } else {
            query.isDraft = true 
        }


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

        setRequestId(dispatch(getPapers('PaperList', query, true)))

        if ( props.type == 'published' ) {
            setResponseRequestId(dispatch(countResponses()))
        } 
    }

    // Our request is dependent on the searchParams, so whenever they change we
    // need to make a new request.
    useEffect(function() {
        const params = {
            searchString: searchParams.get('q'),
            sortBy: searchParams.get('sort'),
            page: searchParams.get('page'),
            fields: searchParams.getAll('fields'),
            status: searchParams.getAll('status'),
            authors: searchParams.getAll('authors'),
            journals: searchParams.getAll('journals')
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
                page: searchParams.get('page'),
                fields: searchParams.getAll('fields'),
                status: searchParams.getAll('status'),
                authors: searchParams.getAll('authors'),
                journals: searchParams.getAll('journals')
            }
            queryForPapers(params)
        }
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            dispatch(clearPaperQuery({ name: 'PaperList' }))
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

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( responseRequestId ) {
                dispatch(cleanupResponseRequest({requestId: responseRequestId}))
            }
        }
    }, [ responseRequestId ])

    // ====================== Render ==========================================

    // Don't render unless we've completed the request, otherwise we could wind
    // up rendering a list generated by a different request.

    let content = ( <Spinner /> )
    let noContent = null

    if ( request && request.state == 'fulfilled' 
        && (props.type != 'published' || ( props.type == 'published' && responseRequest && responseRequest.state == 'fulfilled')))
    {
        content = []
        for (const paper of paperQuery.list) {
            if ( props.type == 'published' ) {
                content.push(<PublishedPaperListItem paper={paper} key={paper.id} />)
            } else {
                content.push(<DraftPapersListItemView paper={paper} key={paper.id} />)
            }
        }

        if ( content.length <= 0 ) {
            content = null
            noContent =  (<div className="empty-search">No papers to list.</div>)
        }
    } else if (request && request.state == 'failed') {
        content = null
        noContent = ( <div className="error">Attempt to retrieve papers failed with error: { request.error }.  Please report this as a bug.</div> ) 
    }


    let title = "Draft Papers"
    if ( props.type == 'preprint') {
        title = (<><DocumentIcon/>Preprints</>)
    } else if ( props.type == 'drafts' ) {
        title = (<><DocumentIcon/>My Drafts</>)
    } else if ( props.type == 'submissions' ) {
        title = (<><InboxIcon/>Submissions</>)
    } else if ( props.type == 'assigned-review' ) {
        title =(<><InboxIcon />Assigned to Me</>)
    } else if ( props.type == 'published' ) {
        title = (<><DocumentCheckIcon/>Papers</>)
    }

    return (
        <List className="paper-list">
            <ListHeader>
                <ListTitle>{ title }</ListTitle>
                <ListControls>
                    { props.type != 'preprint' && props.type != 'published' && <ListControl><SubmissionStatusFilterMenu /></ListControl>}
                    { props.type != 'preprint' && ! props.journalId && <ListControl><JournalFilterMenu /></ListControl>}
                    <ListControl><AuthorFilterMenu /> </ListControl>
                    <ListControl><FieldFilterMenu /></ListControl>
                    <ListControl><SortControl /></ListControl>
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

export default PaperList 
