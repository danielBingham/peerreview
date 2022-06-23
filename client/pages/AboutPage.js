import React from 'react'

import IntroductionSection from '/components/about/sections/IntroductionSection'
import HowItWorksSection from '/components/about/sections/HowItWorksSection'
import RationaleSection from '/components/about/sections/RationaleSection'
import FAQSection from '/components/about/sections/FAQSection'

import './AboutPage.css'

const AboutPage = function(props) {

    return (
        <section id="about-page">
            <h1>About Peer Review</h1>
            <IntroductionSection />
            <HowItWorksSection />
            <RationaleSection />
            <FAQSection />
        </section>
    )

}

export default AboutPage
