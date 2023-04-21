import React, { useEffect } from 'react'

import GetInvolved from '/components/about/sections/GetInvolved'
import IntroductionSection from '/components/about/sections/IntroductionSection'
import HowItWorksSection from '/components/about/sections/HowItWorksSection'
import RationaleSection from '/components/about/sections/RationaleSection'
import FAQSection from '/components/about/sections/FAQSection'
import GovernanceSection from '/components/about/sections/GovernanceSection'
import TeamSection from '/components/about/sections/TeamSection'

import './AboutPage.css'

const AboutPage = function(props) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [])

    return (
        <article id="about-page" className="page">
            <GetInvolved />
            <h1>About Peer Review</h1>
            <IntroductionSection />
            <HowItWorksSection />
            <GovernanceSection />
            <TeamSection />
            <FAQSection />
        </article>
    )

}

export default AboutPage
