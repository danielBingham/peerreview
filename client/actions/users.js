
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
 * A thunk action creator to post a user to the backend and retrieve the
 * complete user (with ID) in response.  It then calls recieveUser() to add the
 * user to our store.
 */
 export const postUser = function(user) { 
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
        });
    };
};

