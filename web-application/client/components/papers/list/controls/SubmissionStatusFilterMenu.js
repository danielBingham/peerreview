import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'

import { CheckIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './SubmissionStatusFilterMenu.css'

const SubmissionStatusFilterMenu = function({}) {
    
    // ============ Query State ===============================================
   
    const [ searchParams, setSearchParams ] = useSearchParams()
    const selected = searchParams.getAll('status')

    // ============ Render State ==============================================
    
    // ============ Request Tracking =========================================
    
    // ============ Redux State ===============================================
    
    // ============ Helpers and Action Handling ======================================
    
    const setStatus = function(status) {
        if ( selected && selected.includes(status) ) {
            searchParams.delete('status', status)
            const newSelected = [ ...selected.filter((s) => s != status) ]
            for(const newStatus of newSelected ) {
                searchParams.append('status', newStatus)
            }
            setSearchParams(searchParams)
        } else {
            searchParams.append('status', status)
            setSearchParams(searchParams)
        } 
    }

    // ============ Effect Handling ===========================================

    // ============ Render ====================================================
    
    const statuses = {
        rejected: 'Rejected',
        submitted: 'Submitted',
        review: 'In Review',
        proofing: 'In Proofing',
        published: 'Published',
        retracted: 'Retracted'
    }

    const menuItemViews = []
    for(const [status, statusView ] of Object.entries(statuses)) {
        menuItemViews.push(
            <FloatingMenuItem className="status" key={status} onClick={(e) => setStatus(status)}>
                { selected && selected.includes(status) && <CheckIcon /> } { statusView } 
            </FloatingMenuItem>
        )
    }

    let selectedView = ''
    if ( selected.length == 1 ) {
        selectedView = `:${statuses[selected[0]]}`
    } else if ( selected.length == 2 ) {
        selectedView = `:${statuses[selected[0]]},${statuses[selected[1]]}`
    } else if ( selected.length > 2 ) {
        selectedView = `:multiple`
    }

    return (
        <FloatingMenu className="submission-status-filter-menu" >
            <FloatingMenuTrigger>Status{selectedView}</FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    Status
                </FloatingMenuHeader>
                { menuItemViews }
            </FloatingMenuBody>
        </FloatingMenu> 
    )

}

export default SubmissionStatusFilterMenu
