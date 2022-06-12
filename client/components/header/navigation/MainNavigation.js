import React from 'react'
import { Link } from 'react-router-dom'

const MainNavigation = function(props) {
    return (
        <section id="main-navigation" className="navigation-block">
            <Link to="/about">about</Link>
            <Link to="/fields">fields</Link>
            <Link to="/users">users</Link>
        </section>
    )

}

export default MainNavigation 
