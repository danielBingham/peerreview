import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getReputations, clearQuery, cleanupRequest as cleanupReputationRequest } from '/state/reputation'

import Field from '/components/fields/Field'
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
    if ( reputationRequest && reputationRequest.state == 'fulfilled') {
        if ( reputations && reputations.results ) {
            const reputationViews = []
            for ( const reputation of reputations.results) {
                reputationViews.push(<div key={ reputation.field.id } className="reputation"><Field field={ reputation.field } /> { parseInt(reputation.reputation).toLocaleString() } </div>)
            }
            content = (
                <div  className="grid-wrapper">
                    {reputationViews}
                </div>
            )
        } 
    } else if ( reputationRequest && reputationRequest.state == 'failed' ) {
        content = (<div className="error"> Something went wrong with the attempt to retrieve reputation: { reputationRequest.error }.</div>)
    }

    return (
        <div id={props.id} className="reputation-list">
            <div className="header">
                <h2>Reputation</h2>
            </div>
            <div className="content">
                {content}
            </div>
            <PaginationControls  prefix={'reputation'} counts={meta} /> 
        </div>
    )

}

export default ReputationList
