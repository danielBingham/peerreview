"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserRoutes = void 0;
var UserController_1 = require("../controllers/UserController");
// RequestHandler<Params, ResBody, ReqBody, ReqQuery>
function initializeUserRoutes(core, router) {
    var userController = new UserController_1.UserController(core);
    var getUsers = function (request, response, next) {
        userController.getUsers(request.query).then(function (result) {
            response.status(200).json(result);
        }).catch(function (error) {
            next(error);
        });
    };
    // Get a list of all users.
    router.get('/users', getUsers);
    // Create a new user 
    router.post('/users', function (request, response, next) {
        userController.postUsers(request, response).catch(function (error) {
            next(error);
        });
    });
    // Get the details of a single user 
    router.get('/user/:id', function (request, response, next) {
        userController.getUser(request, response).catch(function (error) {
            next(error);
        });
    });
    // Replace a user wholesale.
    router.put('/user/:id', function (request, response, next) {
        userController.putUser(request, response).catch(function (error) {
            next(error);
        });
    });
    // Edit an existing user with partial data.
    router.patch('/user/:id', function (request, response, next) {
        return userController.patchUser(request, response).catch(function (error) {
            next(error);
        });
    });
    // Delete an existing user.
    router.delete('/user/:id', function (request, response, next) {
        return userController.deleteUser(request, response).catch(function (error) {
            next(error);
        });
    });
}
exports.initializeUserRoutes = initializeUserRoutes;
