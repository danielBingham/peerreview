import React from 'react'
import { useSelector } from 'react-redux'

import Spinner from '/components/Spinner'
import './ORCIDAuthenticationButton.css'

const ORCIDAuthenticationButton = function(props) {

    const config = useSelector(function(state) {
        return state.system.configuration
    })

    const redirectUri = props.connect ? config.orcid.connect_redirect_uri : config.orcid.authentication_redirect_uri

    return (
        <div className="orcid-authentication">
            <a 
                href={`${config.orcid.authorization_host}/oauth/authorize?client_id=${config.orcid.client_id}&response_type=code&scope=/authenticate&redirect_uri=${redirectUri}`}
            >
                <img src="/img/ORCID.svg" /> Authenticate with your ORCID iD
            </a>
        </div>
    )

}

export default ORCIDAuthenticationButton
