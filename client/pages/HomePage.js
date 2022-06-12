import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

const HomePage = function(props) {

    return (
        <section id="home-page" >
            <PublishedPaperList />
        </section>
    )
}

export default HomePage
