import React from 'react'
import { useSelector } from 'react-redux'

import './ORCIDAuthenticationButton.css'

const ORCIDAuthenticationButton = function(props) {

    const config = useSelector(function(state) {
        return state.system.configuration
    })
    
    return (
        <div className="orcid-authentication">
            <a 
                href={`${config.orcid.authorization_host}/oauth/authorize?client_id=${config.orcid.client_id}&response_type=code&scope=/authenticate&redirect_uri=${config.orcid.redirect_uri}`}
            >
                <img src="/img/ORCID.svg" /> Authenticate with your ORCID iD
            </a>
        </div>
    )

}

export default ORCIDAuthenticationButton
