import React from 'react'

import './Button.css'

const Button = function({ type, className, onClick, children }) {

    return (
        <button
            ahref="" 
            className={`button ${ type ? type : 'primary' } ${ className ? className : '' }`} 
            onClick={(e) => {
                e.preventDefault()

                onClick(e)
            }}
        >
            { children }
        </button>
    )
}

export default Button
