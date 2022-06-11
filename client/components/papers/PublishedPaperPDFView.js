import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, postVotes, cleanupRequest as cleanupPaperRequest } from '../../state/papers'

import PublishedPaperPDFPageView from './PublishedPaperPDFPageView'
import Spinner from '../Spinner'

const PublishedPaperPDFView = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const [ voteRequestId, setVoteRequestId] = useState(null)

    const [ pages, setPages ] = useState([])

    const { id } = useParams() 

    const dispatch = useDispatch()

    // ================= Request Tracking =====================================
    const paperRequest = useSelector(function(state) {
        if ( ! paperRequestId) {
            return null
        } else {
           return state.papers.requests[paperRequestId]
        }
    })

    const voteRequest = useSelector(function(state) {
        if ( ! voteRequestId ) {
            return null
        } else {
            return state.papers.requests[voteRequestId]
        }
    })

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        if ( ! state.papers.dictionary[id] ) {
            return null
        } else {
            return state.papers.dictionary[id]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    let vote = null
    if ( currentUser && paper && paper.votes.length > 0 ) {
        vote = paper.votes.find((v) => v.userId == currentUser.id)
    }
    
    // ================= User Action Handling  ================================

    const voteUp = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            vote = {
                paperId: id,
                userId: currentUser.id,
                score: 1
            }
            setVoteRequestId(dispatch(postVotes(vote)))
        }
    }

    const voteDown = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            vote = {
                paperId: id,
                userId: currentUser.id,
                score: -1
            }
            setVoteRequestId(dispatch(postVotes(vote)))
        }
    }

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        if ( ! paperRequest ) {
            setPaperRequestId(dispatch(getPaper(id)))
        } 

        return function cleanup() {
            if ( paperRequest ) {
                dispatch(cleanupPaperRequest(paperRequestId))
            }

        }

    }, [id])

    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
    useEffect(function() {
        if ( paper && paper.versions.length > 0 ) {
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + paper.versions[0].filepath)
            loadingTask.promise.then(function(pdf) {
                const newPages = []
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const pageKey = `page-${pageNumber}`
                    newPages.push(<PublishedPaperPDFPageView key={pageKey} pageNumber={pageNumber} pdf={pdf} />)
                }
                setPages(newPages)
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ paper ])

    // ================= Render ===============================================
    
    if ( ! paper ) {
        return ( <Spinner /> )
    } else {
        let authorString = ''
        for(const author of paper.authors) {
            authorString += author.user.name + ( author.order < paper.authors.length ? ',' : '')
        }

        let fieldString = ''
        for(const field of paper.fields) {
            fieldString += `[${field.name}] ` 
        }

        let score = 0
        let user_vote = 0
        for(const vote of paper.votes) {
            if ( currentUser && vote.userId == currentUser.id ) {
                user_vote = vote
            }
            score += vote.score
        }

        return (
            <section id={paper.id} className="paper">
                <h2 className="paper-title">{paper.title}</h2>
                <div className="paper-authors">{authorString}</div>
                <div className="paper-fields">{fieldString}</div>
                <div className="paper-votes">
                    <a href="" className={ vote && vote.score==1 ? 'highlight' : '' } onClick={voteUp} >+</a>
                    {score}
                    <a href="" className={ vote && vote.scor==-1 ? 'highlight' : '' } onClick={voteDown} >-</a></div>
                { pages }
            </section>
        )
    }

}

export default PublishedPaperPDFView 
