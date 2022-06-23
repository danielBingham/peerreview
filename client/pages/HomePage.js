import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'

const HomePage = function(props) {

    return (
        <section id="home-page" >
            <WelcomeNotice />
            <SupportNotice />
            <PublishedPaperList />
        </section>
    )
}

export default HomePage
