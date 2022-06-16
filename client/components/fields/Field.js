import React, { useState, useEffect } from 'react'

import './Field.css'

const Field = function(props) {

    const classes = `field ${props.field.type}`

    return (
        <div className={classes}>{props.field.name}</div>
    )
}

export default Field 
