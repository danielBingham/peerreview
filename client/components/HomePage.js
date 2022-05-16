import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import PaperList from './PaperList'

const HomePage = function(props) {

    return (
        <section className="home">
            <PaperList />
        </section>
    )
}

export default HomePage
