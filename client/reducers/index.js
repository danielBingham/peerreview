import { RECIEVE_USER } from '../actions';

const initialState = {
    registeringUser: {}, 
    users: {}
};

function rootReducer(state = initialState, action) {
    switch (action.type) {
        case RECIEVE_USER:
            return Object.assign({}, state, {
                users: Object.assign({}, state.users, { [action.user.id]: action.user })
            });
        default:
            return state;
    }
}


export default rootReducer;
