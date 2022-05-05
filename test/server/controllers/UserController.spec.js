const UserController = require('../../../server/controllers/users.js');
const AuthenticationService = require('../../../server/services/authentication.js');

describe('UserController', function() {
    
    const auth = new AuthenticationService();

    // ====================== Fixture Data ====================================

    const submittedUsers = [
        {
            name: 'John Doe',
            email: 'john.doe@university.edu',
            password: 'p4ssw0rd'
        },
        {
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            password: 'different-password'
        }
    ];

    const database = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            password: auth.hashPassword('p4ssw0rd')
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            password: auth.hashPassword('different-password')
        }
    ];

    const expectedUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu'
        }
    ];

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this);
        this.json = jest.fn(() => this);
    };

    const connection = {
        query: jest.fn()
    };

    beforeEach(function() {
        connection.query.mockReset();
    });

    describe('.getUsers()', function() {
        it('should clean passwords out of the results', async function() {
            connection.query.mockReturnValueOnce({ rowCount: 2, rows: database }); 

            const userController = new UserController(connection);

            const response = new Response();
            await userController.getUsers(null, response);

            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers);
            
        });

    });

   describe('.postUsers()', function() {
        it('should remove password and add id to the returned user result', async function() {
            connection.query.mockReturnValueOnce({rowCount: 0, rows: []}).mockReturnValue({rowCount:1, rows: [database[0]]})
            const request = {
                body: submittedUsers[0]
            };

            const response = new Response();
            const userController = new UserController(connection);
            await userController.postUsers(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(201);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
        });

       it('should hash the password', async function() {

           connection.query.mockReturnValueOnce({rowCount: 0, rows: []}).mockReturnValue({rowCount:1, rows: [database[0]]})

           // Do this so that submittedUsers[0].password doesn't get
           // overwritten and we can use it in future tests.
           const submittedUser = {...submittedUsers[0] };
           const request = {
               body: submittedUser,
           };

           const response = new Response();
           const userController = new UserController(connection);
           await userController.postUsers(request, response);

           const databaseCall = connection.query.mock.calls[1];
           expect(auth.checkPassword(submittedUsers[0].password, databaseCall[1][2])).toEqual(true);
           expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
        });
    });

    describe('.getUser()', function() {
        it('should clean password data out of the user', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})
            const request = {
                params: {
                    id: 1
                }
            };

            const response = new Response();
            const userController = new UserController(connection);
            await userController.getUser(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
        });

    });

    describe('putUser()', function() {
       it('should return the modified user with passwords removed', async function() {
           connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})

           const submittedUser = {...submittedUsers[0]};
           const request = {
               body: submittedUser,
               params: {
                   id: 1
               }
           };
           const response = new Response();
           const userController = new UserController(connection);
           await userController.putUser(request, response);

           expect(response.status.mock.calls[0][0]).toEqual(200);
           expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);

        });

        it('should use request.params.id and ignore user.id', async function() {
           connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})

           const submittedUser = {...submittedUsers[0]};
           submittedUser.id = 2;
           const request = {
                body: submittedUser,
                params: {
                    id: 1
                }
            };
            const response = new Response();

            const userController = new UserController(connection);
            await userController.putUser(request, response);

            const databaseCall = connection.query.mock.calls[0];
            expect(databaseCall[1][3]).toEqual(request.params.id);


            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
        });

        it('should hash the password', async function() {
          connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})

          const submittedUser = {...submittedUsers[0]};
          submittedUser.id = 1;
          // Patch user replaces password on the user object with the hash.
          // So we need to store it here if we want to check it after
          // `patchUser()` has run.
          var password = submittedUser.password;

          // Mocked API
          const auth = new AuthenticationService();
          const request = {
              body: submittedUser,
              params: {
                  id: 1
              }
          };
          const response = new Response();

          const userController = new UserController(connection);
          await userController.putUser(request, response);

          const databaseCall = connection.query.mock.calls[0];
          expect(await auth.checkPassword(password, databaseCall[1][2])).toEqual(true);


          expect(response.status.mock.calls[0][0]).toEqual(200);
          expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
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
