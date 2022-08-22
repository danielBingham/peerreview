import React from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import './PaginationControls.css'

const PaginationControls = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const counts = useSelector(function(state) {
        return state.papers.counts 
    })

    const goToPage = function(page) {
        searchParams.set('page', page)
        setSearchParams(searchParams)
    }

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')) : 1

    const firstPage = 1
    const firstPageParams = new URLSearchParams(searchParams.toString())
    firstPageParams.set('page', firstPage)

    const prevPage = ( page-1 < 1 ? 1 : page-1)
    const prevPageParams = new URLSearchParams(searchParams.toString())
    prevPageParams.set('page', prevPage)

    const nextPage = ( page+1 >= counts.numberOfPages ? counts.numberOfPages : page+1)
    const nextPageParams = new URLSearchParams(searchParams.toString())
    nextPageParams.set('page', nextPage)

    const lastPage = counts.numberOfPages
    const lastPageParams = new URLSearchParams(searchParams.toString())
    lastPageParams.set('page', lastPage)

    return (
        <div className="page-controls">
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(firstPage)}} 
                href={`?${firstPageParams.toString()}`} >first</a>
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(prevPage)}} 
                href={`?${prevPageParams.toString()}`} >prev</a>
            <span className="control">Page {page} of {counts.numberOfPages}</span>
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(nextPage)}} 
                href={`?${nextPageParams.toString()}`} >next</a>
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(lastPage)}} 
                href={`?${lastPageParams.toString()}`} >last</a>
        </div>
    )

}

export default PaginationControls
