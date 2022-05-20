import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, cleanupRequest } from '../../state/papers'

import Spinner from '../Spinner'

const ViewSubmission = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const [ numberOfPages, setNumberOfPages ] = useState(0)
    const [ pdf, setPdf ] = useState(null)
    const [ comments, setComments ] = useState([])

    const { id } = useParams() 

    const dispatch = useDispatch()

    const paperRequest = useSelector(function(state) {
        if ( ! paperRequestId) {
            return null
        } else {
           return state.papers.requests[paperRequestId]
        }
    })

    const paper = useSelector(function(state) {
        if ( ! state.papers.dictionary[id] ) {
            return null
        } else {
            return state.papers.dictionary[id]
        }
    })

    const handleClick = function(event) {
        console.log('X: ' + event.clientX + 'Y: ' + event.clientY)
        const style = { 
            background: 'white',
            border: 'thin solid black',
            position: 'absolute',
            top: event.pageY + 'px',
            left: event.pageX + 'px'
        }
        const key = event.clientY + '-' + event.clientX
        const comment = <div key={key} style={style}>This is a comment</div>
        setComments([ ...comments, comment ])
    }

    useEffect(function() {

        if ( ( ! paper || paper.versions.length == 0 ) && ! paperRequest ) {
            setPaperRequestId(dispatch(getPaper(id)))
        } else if ( paper && paperRequest && paperRequest.state == 'fulfilled' ) {
            dispatch(cleanupRequest(paperRequestId))
        }

    }, [id])

    useEffect(function() {
        if ( paper && paper.versions.length > 0 ) {
            console.log('We get here.')
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + paper.versions[0].filepath)
            loadingTask.promise.then(function(pdf) {
                setNumberOfPages(pdf.numPages) 
                setPdf(pdf)
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ paper ])

    useEffect(function() {
        for (let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
            pdf.getPage(pageNumber).then(function(page) {
                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale, });
                // Support HiDPI-screens.
                var outputScale = window.devicePixelRatio || 1;

                var canvas = document.getElementById(`page-${pageNumber}`);
                var context = canvas.getContext('2d');

                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);
                canvas.style.width = Math.floor(viewport.width) + "px";
                canvas.style.height =  Math.floor(viewport.height) + "px";

                var transform = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : null;

                var renderContext = {
                    canvasContext: context,
                    transform: transform,
                    viewport: viewport
                };
                page.render(renderContext);
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ pdf ])


    if ( ! paper ) {
        return ( <Spinner /> )
    } else {
        let authorString = ''
        for(const author of paper.authors) {
            authorString += author.user.name + ( author.order < paper.authors.length ? ',' : '')
        }

        let pages = []
        if ( numberOfPages > 0 ) {
            for (let page = 1; page <= numberOfPages; page++) {
                const pageId = `page-${page}`
                pages.push(<section className="page-wrapper" key={pageId}>
                    <canvas id={pageId} onClick={handleClick}></canvas>
                </section>)
            }
        }


        return (
            <section id={paper.id} className="paper-submission">
                <h2 className="paper-submission-title">{paper.title}</h2>
                <div className="paper-submission-authors">{authorString}</div>
                {comments}
                { pages }
            </section>
        )
    }

}

export default ViewSubmission
