import React from 'react'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import './UserProfileImage.css'

const UserProfileImage = function(props) {


    let content = ( <Spinner local={true} /> )
    if ( props.file ) {
        const url = new URL(props.file.filepath, props.file.location)
        content = (
            <img src={url.href} />
        )
    } else {
        content = (
            <UserCircleIcon />
        )
    }


    return (
        <div className={ props.className ? `profile-image ${props.className}` : "profile-image"}>
            {content}
        </div>
    )

}

export default UserProfileImage
