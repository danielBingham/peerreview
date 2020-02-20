import * as actions from '../../client/actions';
import { expect } from 'chai';


describe('actions', function() {
    it('RECIEVE_USER should return the correct action object', function() {
        let user = {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com'
        };

        let expectedAction = {
            type: actions.RECIEVE_USER,
            user: user
        };

        expect(actions.recieveUser(user)).to.eql(expectedAction);
    });
});

