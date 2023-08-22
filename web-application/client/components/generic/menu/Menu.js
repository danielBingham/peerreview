import React from 'react'
import { useNavigate } from 'react-router-dom'

import './Menu.css'

const FloatingMenu = function(props) {

    const navigate = useNavigate()
    const selectTab = function(event) {
        event.preventDefault() 
        navigate(props.url)
    }

    return (
        <div className="floating-menu">
            { props.children } 
        </div>
    )
}
export default FloatingMenu 
