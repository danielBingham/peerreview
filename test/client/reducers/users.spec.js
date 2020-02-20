import users from '../../../client/reducers/users.js';
import * as actions from '../../../client/actions';
import { expect } from 'chai';


describe('reducers', function() {
    it('RECIEVE_USER should update the state appropriately when recieving first user', function() {
        let user = {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com'
        };

        let action = {
            type: actions.RECIEVE_USER,
            user: user
        };

        let initialState = {};
        let expectedState = {
            1: user
        };

        expect(users(initialState, action)).to.eql(expectedState);
    });

    it('RECIEVE_USER should update the state appropriately when recieving additional users', function() {

        let user = {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@email.com'
        };
        let action = {
            type: actions.RECIEVE_USER,
            user: user
        };

        let initialState = {
            1: {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            }
        };
        let expectedState = {
            1: {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            },
            2: user
        };

        expect(users(initialState, action)).to.eql(expectedState);


        let user2 = {
            id: 3,
            name: 'Jim Doe',
            email: 'jim.doe@email.com'
        };

        let action2 = {
            type: actions.RECIEVE_USER,
            user: user2
        };

        let expectedState2 = {
            1: {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            },
            2: user,
            3: user2 
        };

        let interimState = users(initialState, action);
        expect(users(interimState, action2)).to.eql(expectedState2);
    });
});

