import React from 'react'
import { Link } from 'react-router-dom'

const UserNavigation = function(props) {
    return (
        <section id="user-navigation" className="navigation-block">
            <Link to="/submissions">submissions</Link>
            &nbsp;
            <Link to="/publish">publish</Link>
        </section>
    )

}

export default UserNavigation 
