import React from 'react';
import {connect} from 'react-redux';
import { postUser } from '../actions/users.js';

class RegistrationForm extends React.Component { 

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    handleInputChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        this.setState({
            [name]:  value
        });
    }

    onSubmit(event) {
        event.preventDefault();
        this.props.onSubmit(this.state);
    }

    render() {
        return (
            <form onSubmit={this.onSubmit}>
                <label htmlFor="name">Name:</label>
                <input type="text" 
                    name="name" 
                    value={this.state.name} 
                    onChange={this.handleInputChange} />
                <label htmlFor="email">Email:</label>
                <input type="text" 
                    name="email" 
                    value={this.state.email}
                    onChange={this.handleInputChange} />
                <label htmlFor="password">Password:</label>
                <input type="password" 
                    name="password" 
                    value={this.state.password}
                    onChange={this.handleInputChange} />
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input type="password" 
                    name="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={this.handleInputChange} />
                <input type="submit" name="register" value="Register" />
            </form>
        );
    }
}

export default RegistrationForm;
