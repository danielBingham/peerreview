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
            <div className="impact-factor">
                0 <span className="label">impact factor</span>
            </div>
            <div className="endorsements">
                0 <span className="label">endorsements</span>
            </div>
                
            <div className="wrapper">
                <div className="name"><Link to={`/journal/${journal.id}`}> {journal.name} </Link></div> 
                <div className="description">{ journal.description }</div>
                <div className="editors">editted by { editorViews } </div>
            </div>
        </div>
    )
}

export default JournalListItem
