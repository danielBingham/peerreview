import React from 'react'
import { Link } from 'react-router-dom'

import './MainNavigation.css'

/**
 * Display primary navigation for the site.
 *
 * @param {object} props    The standard React props object - empty in this case.
 */ 
const MainNavigation = function(props) {

    // ======= Render ===============================================

    return (
        <div id="main-navigation" className="navigation-block">
            <Link to="/about">about</Link>
            <a href="https://blog.peer-review.io">blog</a>
            <Link to="/fields">fields</Link>
            <Link to="/users">users</Link>
        </div>
    )

}

export default MainNavigation 