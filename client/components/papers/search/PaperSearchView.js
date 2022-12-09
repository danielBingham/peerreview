import React, { useState, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import './PaperSearchView.css'

const PaperSearchView = function(props) {
    const [ textQuery, setTextQuery ] = useState('')

    const [searchParams, setSearchParams ] = useSearchParams()

    const navigate = useNavigate()


    const onSubmit = function(event) {
        event.preventDefault()
        const newSearchParams = new URLSearchParams({ q: textQuery })
            console.error(`Navigating.`)
        navigate(`/search?${newSearchParams.toString()}`)
    }

    useLayoutEffect(function() {
        if ( searchParams.get('q')) {
            setTextQuery(searchParams.get('q'))
        }
    }, [])

    return (
        <div className="paper-search-view">
            <form onSubmit={onSubmit}>
                <div className="search-field field-wrapper">
                    <input type="text" 
                        name="text-query" 
                        onChange={(e) => setTextQuery(e.target.value)}
                        value={textQuery} 
                        placeholder="Search papers..."
                    />
                </div>
                <div className="submit">
                    <input type="submit" name="submit" value="Search" />
                </div>
            </form>
        </div>
    )

}

export default PaperSearchView
