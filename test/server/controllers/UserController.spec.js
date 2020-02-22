const UserController = require('../../../server/controllers/users.js');
import sinon from 'sinon';
import { expect } from 'chai';

describe('UserController', function() {

    describe('.getUsers()', function() {
        it('Should query the database and return the results', function() {
            // Fixture data.
            const users = [
                {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@email.com',
                    password: 'p4ssw0rd'
                }
            ];

            const expectedUsers = [
                {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@email.com'
                }
            ];


            // Mocked API
            const database = {
                query: sinon.fake.yields(null, users)
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);

            userController.getUsers(null, response);

            expect(response.json.calledWith(expectedUsers)).to.equal(true);
            
        });

    });

});
