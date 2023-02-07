import React from 'react'
import { useSelector } from 'react-redux'

import './ORCIDTag.css'

const ORCIDTag = function(props) {

    const config = useSelector(function(state) {
        return state.system.configuration
    })

    return (
        <span className="orcid-id"><a href={`${config.orcid.authorization_host}/${props.id}`}><img src="/img/ORCID.svg" /> { props.id }</a></span>
    )

}

export default ORCIDTag
