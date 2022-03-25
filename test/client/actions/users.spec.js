import { expect } from 'chai';

import configureMockStore from 'redux-mock-store';
import thunk from  'redux-thunk';
import fetchMock from 'fetch-mock';

import * as actions from '../../../client/state/users.js';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

afterEach(function() {
    fetchMock.restore();
});

describe('In actions/users.js', function() {
    describe('the `recieveUser(user)` action creator', function() {
        it('should return a correctly formed RECIEVE_USER action object', function() {
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

    describe('the `postUser(user)` thunk action creator', function() {
        it('should POST the /users endpoint with the user in the body and then dispatch RECIEVE_USER', function() { 
            const user = {
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: 'p4ssw0rd'
            };

            const returnedUser = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            };
           
            fetchMock.mock(
                {
                    url: '/api/0.0.0/users',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: user
                },
                // What we want that request to return.
                { 
                    body: returnedUser 
                }
            );
            fetchMock.catch(404);

            const expectedActions = [
                { type: actions.RECIEVE_USER, user: returnedUser }
            ];
            const store = mockStore({
                users: {}
            });

            return store.dispatch(actions.postUser(user)).then(function() {
                const [ url, options ] = fetchMock.lastCall();

                expect(url).to.eql('/api/0.0.0/users');
                expect(options.body).to.eql(JSON.stringify(user));
                expect(store.getActions()).to.eql(expectedActions);
            });
        });
    });


});

