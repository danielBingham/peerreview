import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { FloatingMenu, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './SortControl.css'

const SortControl = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Effect Handling ======================================
    
    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    // ====================== Render ==========================================

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'newest'
    
    return (
        <FloatingMenu className="sort-control-menu" closeOnClick={true}>
            <FloatingMenuTrigger>Sort:{ sort }</FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuItem className="sort-option" onClick={(e) => {setSort('newest')}}>Newest </FloatingMenuItem>
                <FloatingMenuItem className="sort-option" onClick={(e) => {setSort('active')}}>Active </FloatingMenuItem>
            </FloatingMenuBody>
        </FloatingMenu>

    )
}

export default SortControl
