const UserController = require('../../../server/controllers/users.js');
const AuthenticationService = require('../../../server/services/authentication.js');

describe('UserController', function() {

    describe('.getUsers()', function() {
        it('should clean passwords out of the results', async function() {
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
                query: jest.fn(function(sql) {
                    return {
                        rows: users
                    };
                })

            };
            const Response = function() {
                this.status = jest.fn(() => this);
                this.json = jest.fn(() => this);
            };

            const userController = new UserController(database);

            const response = new Response();
            await userController.getUsers(null, response);

            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers);
            
        });

    });

   describe('.postUsers()', function() {
        it('should remove password and add id to the returned user result', async function() {
            // Fixture data.
            const submittedUser = {
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: 'p4ssw0rd'
            };

            const returnedUser = {
                id: 1,
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
                query: jest.fn().mockReturnValueOnce({rowCount: 0, rows: []}).mockReturnValue({rowCount:1, rows: [returnedUser]})
            };
            const request = {
                body: submittedUser 
            };
            const Response = function() {
                this.json = jest.fn(() => this);
                this.status = jest.fn(() => this);
            };

            const response = new Response();
            const userController = new UserController(database);
            await userController.postUsers(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(201);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUser);
        });

       it('should hash the password', async function() {
            const password = 'p4ssw0rd';
            // Fixture data.
            const submittedUser = {
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: password 
            };

            const expectedUser = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com'
            };


            // Mocked API
            const auth = new AuthenticationService();
            const database = {
                query: jest.fn().mockReturnValueOnce({rowCount: 0, rows: []}).mockReturnValue({rowCount:1, rows: [{...submittedUser, id: 1}]})
            };
            const request = {
                body: submittedUser,
            };
            const Response = function() {
                this.json = jest.fn(() => this);
                this.status = jest.fn(() => this);
            };

            const response = new Response();
            const userController = new UserController(database);
            await userController.postUsers(request, response);

            const databaseCall = database.query.mock.calls[1];
            expect(auth.checkPassword(password, databaseCall[1][2])).toEqual(true);

            const jsonCall = response.json.mock.calls[0];
            expect(jsonCall[0]).toEqual(expectedUser);
        });
    });

    xdescribe('.getUser()', function() {
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

    xdescribe('putUser()', function() {
       it('should return `{ success: true }`', async function() {
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
            await userController.putUser(request, response);

            expect(response.json.calledWith({ success: true })).to.equal(true);

        });

        it('should use request.params.id and ignore user.id', async function() {
            // Patch user replaces password on the user object with the hash.
            // So we need to store it here if we want to check it after
            // `patchUser()` has run.
            var password = 'password';             
            const user = {
                id: 2,
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: password 
            };

            // Mocked API
            const auth = new AuthenticationService();
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
            await userController.putUser(request, response);

            const databaseCall = database.query.getCall(0);
            expect(databaseCall.args[1][3]).to.equal(request.params.id);


            expect(response.json.calledWith({ success: true })).to.equal(true, "Wrong return value");

        });

        it('should hash the password', async function() {
            // Patch user replaces password on the user object with the hash.
            // So we need to store it here if we want to check it after
            // `patchUser()` has run.
            var password = 'password';             
            const user = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com',
                password: password 
            };

            // Mocked API
            const auth = new AuthenticationService();
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
            await userController.putUser(request, response);

            const databaseCall = database.query.getCall(0);
            expect(await auth.checkPassword(password, databaseCall.args[1][2])).to.equal(true);


            expect(response.json.calledWith({ success: true })).to.equal(true, "Wrong return value");

        });

    });

    xdescribe('patchUser()', function() {
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

        it('should hash the password', async function() {
            // Patch user replaces password on the user object with the hash.
            // So we need to store it here if we want to check it after
            // `patchUser()` has run.
            var password = 'password';             
            const user = {
                password: password 
            };

            // Mocked API
            const auth = new AuthenticationService();
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
            await userController.patchUser(request, response);

            const expectedSQL = 'update users set password = ? and updated_date = now() where id = ?';

            const databaseCall = database.query.getCall(0);
            expect(databaseCall.args[0]).to.equal(expectedSQL);
            expect(await auth.checkPassword(password, databaseCall.args[1][0])).to.equal(true);


            expect(response.json.calledWith({ success: true })).to.equal(true, "Wrong return value");

        });

    });

    xdescribe('deleteUser()', function() {
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
