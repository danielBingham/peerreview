import React from 'react'
import { Link } from 'react-router-dom'

import './UserNavigation.css'

const UserNavigation = function(props) {
    return (
        <section id="user-navigation" className="navigation-block">
            <Link to="/review">review</Link>
            <Link to="/drafts">drafts</Link>
            <Link to="/publish">publish</Link>
        </section>
    )

}

export default UserNavigation 
