import { RECIEVE_USER } from '../actions/users.js';

export default function users(state = {}, action) {
    switch (action.type) {
        case RECIEVE_USER:
            return Object.assign({}, state, { [action.user.id]: action.user });
        case REQUEST_USER:
            return object.assign({}, state, { 
                [action.user.id]: {
                    requested: true
                }
            });
        default:
            return state;
    }
}
