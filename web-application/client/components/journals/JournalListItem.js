import React  from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import './JournalListItem.css'

const JournalListItem = function(props) {
    const journal = props.journal

    // ======= Render ===============================================

    return (
        <div id={journal.id} className="journal-list-item">
            <div className="wrapper">
                <div className="name"> <Link to={`/journal/${journal.id}`}> {journal.name} </Link></div> 
            </div>
        </div>
    )
}

export default JournalListItem
