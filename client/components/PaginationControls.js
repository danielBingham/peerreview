import React from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import './PaginationControls.css'

const PaginationControls = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const goToPage = function(page) {
        searchParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, page)
        setSearchParams(searchParams)
    }

    const page = searchParams.get(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`) ? parseInt(searchParams.get(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`)) : 1

    const firstPage = 1
    const firstPageParams = new URLSearchParams(searchParams.toString())
    firstPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, firstPage)

    const prevPage = ( page-1 < 1 ? 1 : page-1)
    const prevPageParams = new URLSearchParams(searchParams.toString())
    prevPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, prevPage)

    const nextPage = ( page+1 >= props.counts.numberOfPages ? props.counts.numberOfPages : page+1)
    const nextPageParams = new URLSearchParams(searchParams.toString())
    nextPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, nextPage)

    const lastPage = props.counts.numberOfPages
    const lastPageParams = new URLSearchParams(searchParams.toString())
    lastPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, lastPage)

    return (
        <div className="page-controls">
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(firstPage)}} 
                href={`?${firstPageParams.toString()}`} >first</a>
            <a className="control" 
                onClick={(e) => {e.preventDefault(); goToPage(prevPage)}} 
                href={`?${prevPageParams.toString()}`} >prev</a>
            <span className="control">Page {page} of {props.counts.numberOfPages}</span>
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
