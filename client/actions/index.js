export const CREATE_USER = 'CREATE_USER';
export const POST_USER = 'POST_USER';
export const POST_USER_PASSWORD = 'POST_USER_PASSWORD';
export const REGISTER_USER = 'REGISTER_USER';

const backend = '';

export const createUser = user => ({
    type: CREATE_USER,
    user: user
});

export const postUser = user => dispatch => {
    return fetch(backend + '/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(response => response.json())
    .then(user => dispatch(createUser(user)));
};

export const postUserPassword = user => dispatch => {
    return fetch(backend + '/' + user.id + '/password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({password: user.password});
    });
};

export const registerUser = user => dispatch => {
    dispatch(postUser(user));
    return dispatch(postUserPassword(user));
};
