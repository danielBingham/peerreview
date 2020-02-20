
const backend = '/api/0.0.0';

/**
 * An action and action creator to revieve a user from the backend and update
 * the store.  Assumes we're getting the user from the backend, so the user
 * must have an `id` property.
 */
export const RECIEVE_USER = 'RECIEVE_USER';
export const recieveUser = function(user) { 
    return {
        type: RECIEVE_USER,
        user: user
    };
};

/**
 * We don't want to store the user's password on the front end, so this method
 * simply updates the user's password on the backend.  It doesn't update state
 * at all and that's intentional.
 */
export const postUserPassword = function(id, password) { 
    return function(dispatch) {
        return fetch(backend + '/users/' + id + '/password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({password: password})
        });
    };
};

/**
 * A thunk action creator to post a user to the backend and retrieve the
 * complete user (with ID) in response.  It then calls recieveUser() to add the
 * user to our store.
 */
 export const postUser = function(user) { 
    let password = user.password;
    return function(dispatch) {
        return fetch(backend + '/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        })
        .then(function(response) {
                return response.json()
        })
        .then(function(user) {
            dispatch(recieveUser(user));
            dispatch(postUserPassword(user.id, password))
        });
    };
};


/**
 * A thunk action creator to execute the complete user registration flow:
 * - post the user to the backend (updating the store with the new user)
 * - post the user's password to the backend (don't update the store)
 */
export const registerUser = function(user) { 
    return function(dispatch) {
        return dispatch(postUser(user));
    };
};
