import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { postUser } from '../state/users'

const RegistrationForm = function(props) { 
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const dispatch = useDispatch()


    const onSubmit = function(event) {
        event.preventDefault();

        if (password != confirmPassword) {
            // TODO Error handling!
            return
        }

        const user = {
            name: name,
            email: email,
            password: password,
        }

        dispatch(postUser(user))
    }

    return (
        <form onSubmit={onSubmit}>

            <label htmlFor="name">Name:</label>
            <input type="text" 
                name="name" 
                value={name} 
                onChange={ (event) => setName(event.target.value) } />

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

            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" 
                name="confirmPassword"
                value={confirmPassword}
                onChange={ (event) => setConfirmPassword(event.target.value) } />
            <input type="submit" name="register" value="Register" />
        </form>
    )
}

export default RegistrationForm
