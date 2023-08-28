import React from 'react'

import './Button.css'

const Button = function({ type, disabled, className, onClick, children }) {

    return (
        <button
            ahref="" 
            className={`button ${ type ? type : 'default' } ${ className ? className : '' }`} 
            onClick={(e) => {
                e.preventDefault()

                onClick(e)
            }}
            disabled={disabled}
        >
            { children }
        </button>
    )
}

export default Button
