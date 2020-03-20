import React from 'react';

class UserProfile extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id={this.props.id}>
                <p><span class="label">Name:</span> {this.props.name}</p>
                <p><span class="label">Email:</span> {this.props.email}</p>
            </div>
        );
    }
}

export default UserProfile;
