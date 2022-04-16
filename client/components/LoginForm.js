import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import Spinner from './Spinner'


import { useDispatch, useSelector } from 'react-redux'
import { authenticate } from '../state/authentication'

const LoginForm = function(props) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const authentication = useSelector(function(state) {
        return state.authentication
    })

    const onSubmit = function(event) {
        event.preventDefault();

        dispatch(authenticate(email, password))
    }

    useEffect(function() {
        if (authentication.currentUser) {
            navigate("/", { replace: true })
        }
    })


    if (authentication.authenticate.requestInProgress) {
        return (
            <Spinner />
        )
    }

    return (
        <form onSubmit={onSubmit}>
            {authentication.authenticate.failed && <div className="authentication-error">Login failed.</div>}

            <label htmlFor="email">Email:</label>
            <input type="text" 
                name="email" 
                value={email}
                onChange={ (event) => setEmail(event.target.value) } />

            <label htmlFor="password">Password:</label>
            <input type="password" 
                name="password" 
                value={password}
                onChange={ (event) => setPassword(event.target.value) } />
            <input type="submit" name="login" value="Login" />
        </form>
    )
}

export default LoginForm 
