import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import './Page.css'

export const Page = function({ id, children }) {
    return (
        <div id={id} className="page">
            { children }
        </div>
    )
}

export const PageBody = function({ children }) {
    return (
        <div className="page-body">
            { children }
        </div>
    )
}


export const PageHeader = function({ children }) {

    return (
        <div className="page-header">
            { children }
        </div>
    )
}

export const PageHeaderGrid = function({ children }) {
    return (
        <div className="page-header-grid">
            { children }
        </div>
    )
}

export const PageHeaderControls = function({ children }) {
    return (
        <div className="page-header-controls">
            { children }
        </div>
    )
}
export const PageHeaderMain = function({ children }) {
    return (
        <div className="page-header-main">
            { children }
        </div>
    )
}

export const PageTabBar = function({ children }) {


    return (
        <div className="page-tab-bar">
            <div className="tabs-wrapper">
                { children }
            </div>
        </div>
    )
}

export const PageTab = function({ url, tab, initial, children }) {

    const { pageTab } = useParams()

    const navigate = useNavigate()

    return (
        <Link to={url}
            className={`page-tab ${ (  (pageTab == tab || ( !pageTab && initial)) ? 'selected' : '' )}`}
        >
            { children } 
        </Link>
    )
}
