import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import JournalList from '/components/journals/JournalList'

const JournalsListPage = function(props) {

    return (
        <div id="journals-list-page" className="page">
            <JournalList />
        </div>
    )

}

export default JournalsListPage
