import { RECIEVE_USER } from '../actions/users.js';

export default function users(state = {}, action) {
    switch (action.type) {
        case RECIEVE_USER:
            return Object.assign({}, state, { [action.user.id]: action.user });
        default:
            return state;
    }
}
