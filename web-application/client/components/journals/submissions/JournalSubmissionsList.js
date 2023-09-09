import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'


import { getJournalSubmissions, cleanupRequest } from '/state/journalSubmissions'

import DateTag from '/components/DateTag'
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

import AssignmentFilterMenu from '/components/journals/widgets/assignments/AssignmentFilterMenu'
import JournalFilterMenu from '/components/papers/list/controls/JournalFilterMenu'
import AuthorFilterMenu from '/components/papers/list/controls/AuthorFilterMenu'
import SubmissionStatusFilterMenu from '/components/papers/list/controls/SubmissionStatusFilterMenu' 
import FieldFilterMenu from '/components/papers/list/controls/FieldFilterMenu'

import SubmissionControls from '/components/journals/widgets/SubmissionControls'
import DraftPapersListItemView from '/components/papers/list/DraftPapersListItemView'

import SubmissionStatusWidget from '/components/journals/widgets/status/SubmissionStatusWidget'
import AssignmentWidget from '/components/journals/widgets/assignments/AssignmentWidget'

import JournalSubmissionsListItem from './JournalSubmissionsListItem'

import './JournalSubmissionsList.css'

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
const JournalSubmissionsList = function(props) {
    
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId) {
            return state.journalSubmissions.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const submissionQuery = useSelector(function(state) {
        if ( state.journalSubmissions.queries['JournalSubmissionsList'] ) {
            return state.journalSubmissions.queries['JournalSubmissionsList']
        } else {
            return null 
        }
    })

    const paperDictionary = useSelector(function(state) {
        const dictionary = {}
        if ( submissionQuery ) {
            for(const submission of submissionQuery.list) {
                dictionary[submission.paperId] = state.papers.dictionary[submission.paperId]
            }
        }
        return dictionary
    })


    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    const queryForPapers = function({ fields, status, authors, reviewers, editors, sortBy, page }) {
        let query = { 
            status: [ 'submitted', 'review', 'proofing' ], 
            relations: [ "papers", "users"] 
        }

        if ( fields.length > 0 ) {
            query.fields = fields 
        }

        if ( status.length > 0 ) {
            query.status = status
        }

        if ( authors.length > 0 ) {
            query.authors = authors
        }

        if ( reviewers && reviewers.length > 0) {
            query.reviewers = reviewers
        }

        if ( editors && editors.length > 0) {
            query.editors = editors
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

        setRequestId(dispatch(getJournalSubmissions('JournalSubmissionsList', props.id, query)))
    }

    useEffect(function() {
        const params = {
            fields: searchParams.getAll('fields'),
            status: searchParams.getAll('status'),
            authors: searchParams.getAll('authors'),
            reviewers: searchParams.getAll('reviewers'),
            editors: searchParams.getAll('editors'),
            page: searchParams.get('page'),
            sortBy: searchParams.get('sort')
        }
        queryForPapers(params)
    }, [ props.id, searchParams ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====================== Render ==========================================

    // Don't render unless we've completed the request, otherwise we could wind
    // up rendering a list generated by a different request.

    let content = ( <Spinner /> )
    let noContent = null
    if ( request && request.state == 'fulfilled' ) {
        content = []
        for (const submission of submissionQuery.list) {

            content.push(
                <JournalSubmissionsListItem submissionId={submission.id} />
            )
        }

        if ( content.length <= 0 ) {
            content = null
            noContent =  (<div className="empty-search">No submissions to list.</div>)
        }
    } else if (request && request.state == 'failed') {
        content = null
        noContent = ( <div className="error">Attempt to retrieve drafts failed with error: { request.error }.  Please report this as a bug.</div> ) 
    }


    return (
        <List>
            <ListHeader>
                <ListTitle>Draft Submissions</ListTitle>
                <ListControls>
                    <ListControl><SubmissionStatusFilterMenu /> </ListControl>
                    <ListControl><AuthorFilterMenu /> </ListControl>
                    <ListControl><FieldFilterMenu /></ListControl>
                    <ListControl><AssignmentFilterMenu type="editors" id={props.id} /></ListControl>
                    <ListControl><AssignmentFilterMenu type="reviewers" id={props.id} /></ListControl>
                </ListControls>
            </ListHeader>
            <ListNoContent>
                {noContent}
            </ListNoContent>
            <ListRowContent>
                { content }
            </ListRowContent>
            <PaginationControls meta={submissionQuery?.meta} />
        </List>
    )

}

export default JournalSubmissionsList 
