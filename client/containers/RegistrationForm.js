import React from 'react';
import {connect} from 'react-redux';
import { registerUser } from 'actions';

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
        this.handleRegisterUser = this.handleRegisterUser.bind(this);
    }

    handleInputChange(event) {
        const name = event.target.name;

        this.state[name] = event.target.value;
    }

    handleRegisterUser(event) {
        event.preventDefault();
        if ( this.state.password != this.state.confirmPassword ) {
            // TODO Give some sort of error.
            return;
        }
        let user = {
            name: this.state.name,
            email: this.state.email,
            password: this.state.password
        };
        this.props.dispatch(registerUser(user));
    }

    render() {
        return (
            <form onSubmit={this.handleRegisterUser}>
                <label for="name">Name:</label>
                <input type="text" 
                    name="name" 
                    value={this.state.name} 
                    onChange={this.handleInputChange} />
                <label for="email">Email:</label>
                <input type="text" 
                    name="email" 
                    value={this.state.email}
                    onChange={this.handleInputChange} />
                <label for="password">Password:</label>
                <input type="password" 
                    name="password" 
                    value={this.state.password}
                    onChange={this.handleInputChange} />
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" 
                    name="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={this.handleInputChange} />
                <input type="submit" name="register" value="Register" />
            </form>
        );
    }
}

export default connect()(RegistrationForm);
