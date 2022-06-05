const UserController = require('../../../server/controllers/users.js');
const AuthenticationService = require('../../../server/services/authentication.js');

describe('UserController', function() {
    
    const auth = new AuthenticationService();

    // ====================== Fixture Data ====================================

    const submittedUsers = [
        {
            name: 'John Doe',
            email: 'john.doe@university.edu',
            password: 'password'
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
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    ];

    const expectedUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    ];

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this);
        this.json = jest.fn(() => this);
        this.send = jest.fn(() => this);
    };

    const connection = {
        query: jest.fn()
    };

    beforeEach(function() {
        connection.query.mockReset();
    });

    describe('.getUsers()', function() {
        it('should return 200 and the users', async function() {
            connection.query.mockReturnValueOnce({ rowCount: 2, rows: database }); 

            const userController = new UserController(connection);

            const response = new Response();
            await userController.getUsers(null, response);

            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers);
            
        });

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const userController = new UserController(connection)

            const response = new Response()
            await userController.getUsers(null, response)

            expect(response.status.mock.calls[0][0]).toEqual(500);
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        });

    });

   describe('.postUsers()', function() {
       it('should hash the password and return 201 with the modified user', async function() {

           connection.query.mockReturnValueOnce({rowCount: 0, rows: []})
               .mockReturnValue({rowCount:1, rows: [ { id: database[0].id } ]})
               .mockReturnValue({rowCount:1, rows: [ database[0] ] })

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
           expect(response.status.mock.calls[0][0]).toEqual(201);
           expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
       });

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            // Do this so that submittedUsers[0].password doesn't get
            // overwritten and we can use it in future tests.
            const submittedUser = {...submittedUsers[0] };
            const request = {
                body: submittedUser,
            };

            const response = new Response()
            const userController = new UserController(connection)
            await userController.postUsers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500);
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        });

    });

    describe('.getUser()', function() {
        it('should return 200 and the requested user', async function() {
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

        it('should return 404 when the user does not exist', async function() {
            connection.query.mockReturnValue({rowCount:0, rows: []})
            const request = {
                params: {
                    id: 3
                }
            };

            const response = new Response();
            const userController = new UserController(connection);
            await userController.getUser(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(404);
            expect(response.json.mock.calls[0][0]).toEqual([]);
        });

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const request = {
                params: {
                    id: 1
                }
            };

            const response = new Response()
            const userController = new UserController(connection)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500);
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        });

    });

    describe('putUser()', function() {
       it('should return 200 and the modified user', async function() {
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

        it('should return 404 when the user does not exist', async function() {
            connection.query.mockReturnValue({rowCount:0, rows: []})

            const submittedUser = {...submittedUsers[0]};
            const request = {
                body: submittedUser,
                params: {
                    id: 1
                }
            };

            const response = new Response();
            const userController = new UserController(connection);
            await userController.getUser(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(404);
            expect(response.json.mock.calls[0][0]).toEqual([]);
        });

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const submittedUser = {...submittedUsers[0]};
            const request = {
                body: submittedUser,
                params: {
                    id: 1
                }
            };

            const response = new Response()
            const userController = new UserController(connection)
            await userController.getUser(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500);
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        });

    });

    describe('patchUser()', function() {
        it('should construct update SQL', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]});

            // Fixture data.
            const submittedUser = {
                name: 'John Doe',
                email: 'john.doe@email.com',
            };
            const request = {
                body: submittedUser,
                params: {
                    id: 1
                }
            };
            const response = new Response();

            const userController = new UserController(connection);
            await userController.patchUser(request, response);

            const expectedSQL = 'UPDATE users SET name = $1 and email = $2 and updated_date = now() WHERE id = $3';
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ];

            const databaseCall = connection.query.mock.calls[0];
            expect(databaseCall[0]).toEqual(expectedSQL);
            expect(databaseCall[1]).toEqual(expectedParams);

            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);

        });

        it('should ignore the id in the body and use the id in request.params', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]});

            // Fixture data.
            const submittedUser = {
                id: 2,
                name: 'John Doe',
                email: 'john.doe@email.com'
            };

            const request = {
                body: submittedUser,
                params: {
                    id: 1
                }
            };

            const response = new Response();
            const userController = new UserController(connection);
            await userController.patchUser(request, response);

            const expectedSQL = 'UPDATE users SET name = $1 and email = $2 and updated_date = now() WHERE id = $3';
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ];

            const databaseCall = connection.query.mock.calls[0];
            expect(databaseCall[0]).toEqual(expectedSQL);
            expect(databaseCall[1]).toEqual(expectedParams);

            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);

        });

        it('should hash the password', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]});


            // Patch user replaces password on the user object with the hash.
            // So we need to store it here if we want to check it after
            // `patchUser()` has run.
            var password = 'password';             
            const submittedUser = {
                password: password 
            };

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
            await userController.patchUser(request, response);

            const expectedSQL = 'UPDATE users SET password = $1 and updated_date = now() WHERE id = $2';

            const databaseCall = connection.query.mock.calls[0];
            expect(databaseCall[0]).toEqual(expectedSQL);
            expect(await auth.checkPassword(password, databaseCall[1][0])).toEqual(true);


            expect(response.json.mock.calls[0][0]).toEqual(expectedUsers[0]);
        });

    });

    describe('deleteUser()', function() {
        it('return `200` and the id of the deleted user on success', async function() {
            connection.query.mockReturnValue({rowcount:1});

            const request = {
                params: {
                    id: 1
                }
            };

            const response = new Response();

            const userController = new UserController(connection);
            await userController.deleteUser(request, response);

            expect(response.status.mock.calls[0][0]).toEqual(200);
            expect(response.json.mock.calls[0][0]).toEqual({userId: 1});
        });

    });

});
