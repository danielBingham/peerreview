const UserController = require('../../../server/controllers/users.js');
import sinon from 'sinon';
import { expect } from 'chai';

describe('UserController', function() {

    describe('.getUsers()', function() {
        it('should clean passwords out of the results', function() {
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

    describe('.postUsers()', function() {
        it('should remove password and add id to the returned user result', function() {
            // Fixture data.
            const user = {
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: 'p4ssw0rd'
            };

            const expectedUser = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            };

            // Mocked API
            const database = {
                query: sinon.fake.yields(null, {insertId: 1})
            };
            const request = {
                body: user
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.postUsers(request, response);

            expect(response.json.calledWith(expectedUser)).to.equal(true);
        });
    });

    describe('.getUser()', function() {
        it('should clean password data out of the user', function() {
            // Fixture data.
            const user = [{
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: 'p4ssw0rd'
            }];

            const expectedUser = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            };

            // Mocked API
            const database = {
                query: sinon.fake.yields(null, user)
            };
            const request = {
                params: {
                    id: 1
                }
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.getUser(request, response);

            expect(response.json.calledWith(expectedUser)).to.equal(true);
        });

    });

    describe('putUser()', function() {
        it('should return `{ success: true }`', function() {
            // Fixture data.
            const user = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: 'p4ssw0rd'
            };

            // Mocked API
            const database = {
                query: sinon.fake.yields(null)
            };
            const request = {
                body: user,
                params: {
                    id: 1
                }
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.putUser(request, response);

            expect(response.json.calledWith({ success: true })).to.equal(true);

        });

    });

    describe('patchUser()', function() {
        it('should construct update SQL and return `{ success: true }`', function() {
            // Fixture data.
            const user = {
                name: 'John Doe',
                email: 'john.doe@email.com',
            };

            // Mocked API
            const database = {
                query: sinon.stub().yields(null)
            };
            const request = {
                body: user,
                params: {
                    id: 1
                }
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.patchUser(request, response);

            const expectedSQL = 'update users set name = ? and email = ? and updated_date = now() where id = ?';
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ];

            const databaseCall = database.query.getCall(0);
            expect(databaseCall.args[0]).to.equal(expectedSQL);
            expect(databaseCall.args[1]).to.eql(expectedParams);

            expect(response.json.calledWith({ success: true })).to.equal(true, "Wrong return value");

        });

        it('should ignore the id in the body and use the id in request.params', function() {
            // Fixture data.
            const user = {
                id: 2,
                name: 'John Doe',
                email: 'john.doe@email.com',
            };

            // Mocked API
            const database = {
                query: sinon.stub().yields(null)
            };
            const request = {
                body: user,
                params: {
                    id: 1
                }
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.patchUser(request, response);

            const expectedSQL = 'update users set name = ? and email = ? and updated_date = now() where id = ?';
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ];

            const databaseCall = database.query.getCall(0);
            expect(databaseCall.args[0]).to.equal(expectedSQL);
            expect(databaseCall.args[1]).to.eql(expectedParams);

            expect(response.json.calledWith({ success: true })).to.equal(true, "Wrong return value");

        });

    });

    describe('deleteUser()', function() {
        it('should return `{ success: true }`', function() {
            // Mocked API
            const database = {
                query: sinon.fake.yields(null)
            };
            const request = {
                params: {
                    id: 1
                }
            };
            const response = {
                json: sinon.spy()
            };

            const userController = new UserController(database);
            userController.deleteUser(request, response);

            expect(response.json.calledWith({ success: true })).to.equal(true);

        });

    });

});
