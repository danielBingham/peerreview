import React from 'react'

import './DateTag.css'


const DateTag = function(props) {
    const date = new Date(props.timestamp)
    const now = new Date()

    //TODO TECHDEBT The database is recording dates in a weird way that I don't
    //understand.  It's not UTC.  I don't know what timezone its in.  We need
    //to sort it out. 
    const secondsSinceEpoc = Math.floor((date.getTime() - (4*60*60*1000))/1000)

    let content = null
    const diff = Math.floor(Date.now()/1000) - secondsSinceEpoc
    if ( diff <= 60 ) {
        content = `${diff} seconds ago`
    } else if ( Math.floor(diff/60) < 60 ) {
        content = `${Math.floor(diff/60)} minutes ago`
    } else if ( Math.floor(diff / (60*60)) < 24 ) {
        content = `${Math.floor(diff/(60*60))} hours ago`
    } else if ( Math.floor(diff / (24*60*60)) < 30 ) {
        content = `${Math.floor(diff / (24*60*60))} days ago`
    } else {
        content = `on ${date.toLocaleDateString('en-us')}`
    }

    return (
        <div className="date-tag">{ content }</div>
    )

}

export default DateTag 