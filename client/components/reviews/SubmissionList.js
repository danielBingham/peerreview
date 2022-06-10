import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUserPapers, cleanupRequest } from '../../state/users'

import Spinner from '../Spinner'

const PaperListItem = function(props) {
    const paper = props.paper

    let authorList = ''
    for (let i = 0; i < paper.authors.length; i++) {
        authorList += paper.authors[i].user.name 
        if (i < paper.authors.length-1) {
            authorList += ', '
        }
    }

        const paperPath = `/submission/${paper.id}`
    return (
        <li id={paper.id} >[{Math.floor(Math.random() * 100)} votes] [{Math.floor(Math.random()*10)} responses] <Link to={paperPath}>{paper.title}</Link> by {authorList} [physics] [particle-physics]</li>
    )
}

const SubmissionList = function(props) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // TODO We'll need to make sure currentUser is up to date.  If we just
    // published a new paper, it won't be on current user yet.
    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    // ====================== Render ==========================================

    if ( ! currentUser ) {
        return (
            <Spinner />
        )
    } else {
        const listItems = []
        for (let id in currentUser.papers) {
            listItems.push(<PaperListItem paper={currentUser.papers[id]} key={id} />)
        }

        return (
            <section className="paper-list">
                <ul>
                    {listItems}
                </ul>
            </section>
        )
    }

}

export default SubmissionList 
