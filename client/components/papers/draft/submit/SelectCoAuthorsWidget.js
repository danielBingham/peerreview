import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { ArrowLongUpIcon, ArrowLongDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import AuthorsInput from './AuthorsInput'
import Spinner from '/components/Spinner'

import './SelectCoAuthorsWidget.css'

const SelectCoAuthorsWidget = function(props) {

    // ================ Render State ================================

    // ================== Request Tracking ====================================
    
    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // =========== Actions and Event Handling =====================================

    const assignPermissions = function(author, permissions) {
        if ( permissions == 'owner' ) {
            author.owner = true
        } else {
            author.owner = false
        }
        const newAuthors = props.authors.filter((a) => a.user.id != author.user.id)
        newAuthors.push(author)
        newAuthors.sort((a,b) => a.order - b.order)
        props.setAuthors(newAuthors)
    }

    const removeAuthor = function(author) {
        if ( author.user.id == currentUser.id ) {
            return
        }
           
        const newAuthors = props.authors.filter((a) => a.user.id != author.user.id)
        props.setAuthors(newAuthors)
    }

    const moveUp = function(author) {
        if ( author.order == 1 ) {
            return
        }

        const authorAbove = props.authors.find((a) => a.order == author.order-1)

        const newAuthors = props.authors.filter((a) => a.user.id != author.user.id && a.user.id != authorAbove.user.id)
        author.order = author.order - 1
        authorAbove.order = authorAbove.order + 1
        newAuthors.push(author)
        newAuthors.push(authorAbove)
        newAuthors.sort((a,b) => a.order - b.order)
        props.setAuthors(newAuthors)
    }

    const moveDown = function(author) {
        if ( author.order == props.authors.length ) {
            return
        }

        const authorBelow = props.authors.find((a) => a.order == author.order+1)

        const newAuthors = props.authors.filter((a) => a.user.id != author.user.id && a.user.id != authorBelow.user.id)
        author.order = author.order + 1
        authorBelow.order = authorBelow.order - 1
        newAuthors.push(author)
        newAuthors.push(authorBelow)
        newAuthors.sort((a, b) => a.order - b.order)
        props.setAuthors(newAuthors)
    }

    // ================= Effect Handling =======================
    

    // ====================== Render ==========================================

    const selectedAuthorViews = []

    let sortableAuthors = [ ...props.authors]
    sortableAuthors.sort((a, b) => a.order - b.order)

    for(const author of sortableAuthors) {
        selectedAuthorViews.push( 
            <div key={author.user.id} className="selected-author">
                <div className="left">
                    { author.order != 1 && <a href="" onClick={(e) => {e.preventDefault(); moveUp(author)}}><ArrowLongUpIcon /></a>}
                    { author.order != props.authors.length && <a href="" onClick={(e) => {e.preventDefault(); moveDown(author)}}><ArrowLongDownIcon /></a> }
                    <span className="order">{author.order}.</span>
                    <UserTag id={author.user.id} /> 
                </div>
                <div className="right">
                    <select 
                        onChange={(e) => assignPermissions(author, e.target.value) } 
                        value={ author.owner ? 'owner' : 'commenter' } name="permissions"
                    > 
                        <option value="owner">Owner</option>
                        <option value="commenter">Commenter</option>
                    </select>
                    { author.user.id != currentUser.id && <a href="" onClick={(e) => { e.preventDefault(); removeAuthor(author) }} ><XMarkIcon  /></a> }
                </div>
            </div>
        )
    }

    return (
        <div id="select-co-authors-widget" className="select-co-authors-widget">
            <AuthorsInput authors={props.authors} setAuthors={props.setAuthors} />
            <div className="selected-authors">
                {selectedAuthorViews}
            </div>
        </div>
    )

}

export default SelectCoAuthorsWidget
