import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getReputations, clearQuery, cleanupRequest as cleanupReputationRequest } from '/state/reputation'

import Field from '/components/fields/Field'
import List from '/components/generic/list/List'
import ListControl from '/components/generic/list/ListControl'
import ListHeader from '/components/generic/list/ListHeader'
import ListGridContent from '/components/generic/list/ListGridContent'
import ListNoContent from '/components/generic/list/ListNoContent'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './ReputationList.css'

const ReputationList = function(props) {
    const [searchParams, setSearchParams] = useSearchParams()

    const [ paged, setPaged ] = useState(false)

    const [ reputationRequestId, setReputationRequestId ] = useState(null)
    const reputationRequest = useSelector(function(state) {
        if ( ! reputationRequestId) {
            return null
        } else {
            return state.reputation.requests[reputationRequestId]
        }
    })

    const reputations = useSelector(function(state) {
        return state.reputation.query[props.userId]
    })

    const meta = useSelector(function(state) {
        if ( ! state.reputation.query[props.userId] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.reputation.query[props.userId].meta
    })

    const dispatch = useDispatch()
    useEffect(function() {
        const page = searchParams.get('reputation-page')
        if ( page ) {
            setReputationRequestId(dispatch(getReputations(props.userId, { page: page } )))
        } else {
            setReputationRequestId(dispatch(getReputations(props.userId)))
        }
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( reputationRequestId ) {
                dispatch(cleanupReputationRequest({ requestId: reputationRequestId }))
            }
        }
    }, [ reputationRequestId ])


    let content = ( <Spinner local={true} /> )
    let noContent = null
    if ( reputationRequest && reputationRequest.state == 'fulfilled') {
        if ( reputations && reputations.results ) {
            const reputationViews = []
            for ( const reputation of reputations.results) {
                reputationViews.push(<div key={ reputation.field.id } className="reputation"><Field id={ reputation.field.id } /> { parseInt(reputation.reputation).toLocaleString() } </div>)
            }

            if ( reputationViews.length > 0 ) {
                content = reputationViews
            } else {
                content = null
                noContent = (<span>No reputation earned.</span>)
            }
        }  else {
            content = null
            noContent = (<span>No reputation earned.</span>)
        }
    } else if ( reputationRequest && reputationRequest.state == 'failed' ) {
        content = null
        noContent = (<div className="error"> Something went wrong with the attempt to retrieve reputation: { reputationRequest.error }.</div>)
    }

    return (
        <List>
            <ListHeader title="Reputation">
            </ListHeader>
            <ListNoContent>
                {noContent}
            </ListNoContent>
            <ListGridContent>
                {content}
            </ListGridContent>
            <PaginationControls  prefix={'reputation'} meta={meta} /> 
        </List>
    )

}

export default ReputationList
