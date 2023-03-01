import React from 'react'
import { useNavigate } from 'react-router-dom'

import './PageTab.css'

const PageTab = function(props) {

    const navigate = useNavigate()
    const selectTab = function(event) {
        event.preventDefault() 
        navigate(props.url)
    }

    return (
        <a href={props.url}
            onClick={(e) => selectTab(e)} 
            className={`page-tab ${ ( props.selected ? 'selected' : '' )}`}
        >
            { props.children } 
        </a>
    )
}
export default PageTab
