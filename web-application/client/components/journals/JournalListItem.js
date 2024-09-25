import React  from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import UserTag from '/components/users/UserTag'

import './JournalListItem.css'

const JournalListItem = function(props) {
    const journal = props.journal

    // ======= Render ===============================================

    const editorViews = []
    for(const member of journal.members) {
        if ( member.permissions == 'owner' || member.permissions == 'editor' ) {
            editorViews.push(
                <span key={member.userId} className="editor"><UserTag id={member.userId} /></span>
            )
        }
    }
    
    return (
        <div id={journal.id} className="journal-list-item">
            <div className="wrapper">
                <div className="name"><Link to={`/journal/${journal.id}`}> {journal.name} </Link></div> 
                { journal.description && <div className="description">{ journal.description }</div> }
                <div className="editors">editted by { editorViews } </div>
            </div>
        </div>
    )
}

export default JournalListItem
