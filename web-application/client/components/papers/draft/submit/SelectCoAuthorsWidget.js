import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { ArrowLongUpIcon, ArrowLongDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import UserInput from '/components/users/input/UserInput'

import './SelectCoAuthorsWidget.css'

const SelectCoAuthorsWidget = function(props) {

    // ================ Render State ================================

    // ================== Request Tracking ====================================
    
    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const userDictionary = useSelector(function(state) {
        const users = {}
        for(const author of props.authors) {
            users[author.userId] = state.users.dictionary[author.userId]
        }
        return users
    })

    // =========== Actions and Event Handling =====================================

    const selectAuthor = function(user) {
        if ( props.authors.find((a) => a.userId == user.id) ) {
            return 'That author has already been added.'
        } 

        const author = {
            userId: user.id,
            order: props.authors.length+1,
            owner: false,
            submitter: false
        }
        props.setAuthors([ ...props.authors,author])
    }

    const assignRole = function(author, role) {
        author.role = role

        const newAuthors = props.authors.filter((a) => a.userId != author.userId)
        newAuthors.push(author)
        newAuthors.sort((a,b) => a.order - b.order)
        props.setAuthors(newAuthors)
    }

    const removeAuthor = function(author) {
        if ( author.userId == currentUser.id ) {
            return
        }
           
        const newAuthors = props.authors.filter((a) => a.userId != author.userId)
        props.setAuthors(newAuthors)
    }

    const moveUp = function(author) {
        if ( author.order == 1 ) {
            return
        }

        const authorAbove = props.authors.find((a) => a.order == author.order-1)

        const newAuthors = props.authors.filter((a) => a.userId != author.userId && a.userId != authorAbove.userId)
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

        const newAuthors = props.authors.filter((a) => a.userId != author.userId && a.userId != authorBelow.userId)
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
            <div key={author.userId} className="selected-author">
                <div className="left">
                    { author.order != 1 && <a href="" onClick={(e) => {e.preventDefault(); moveUp(author)}}><ArrowLongUpIcon /></a>}
                    { author.order != props.authors.length && <a href="" onClick={(e) => {e.preventDefault(); moveDown(author)}}><ArrowLongDownIcon /></a> }
                    <span className="order">{author.order}.</span>
                    <UserTag id={author.userId} /> 
                </div>
                <div className="right">
                    { userDictionary[author.userId].status == 'invited' ? <span className="status">Invited</span> : null }
                    <select 
                        onChange={(e) => assignRole(author, e.target.value) } 
                        value={ author.role } name="role"
                    > 
                        <option value="corresponding-author">Corresponding Author</option>
                        <option value="author">Author</option>
                    </select>
                    { author.userId != currentUser.id && <a href="" onClick={(e) => { e.preventDefault(); removeAuthor(author) }} ><XMarkIcon  /></a> }
                </div>
            </div>
        )
    }

    return (
        <div id="select-co-authors-widget" className="select-co-authors-widget">
            <UserInput
               label={'Authors'}
                explanation={'Select co-authors to add to this paper. Corresponding authors can edit the submission, post new versions, and submit to journals.  Authors can view and comment on all reviews.'}
                onBlur={props.onBlur}
                selectUser={selectAuthor}
            />
            <div className="selected-authors">
                {selectedAuthorViews}
            </div>
        </div>
    )

}

export default SelectCoAuthorsWidget
