"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
var peerreview_backend_1 = require("@danielbingham/peerreview-backend");
var ControllerError_1 = require("../errors/ControllerError");
var UserController = /** @class */ (function () {
    function UserController(core, database) {
        this.core = core;
        this.database = core.database;
        if (database) {
            this.database = database;
        }
        this.auth = new peerreview_backend_1.AuthenticationService(core);
        this.emailService = new peerreview_backend_1.EmailService(core);
        this.userDAO = new peerreview_backend_1.UserDAO(core);
        this.tokenDAO = new peerreview_backend_1.TokenDAO(core);
    }
    UserController.prototype.getRelations = function (results, requestedRelations) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {}];
            });
        });
    };
    /**
     * Parse a query string from the `GET /users` endpoint for use with both
     * `UsersDAO::selectUsers()` and `UsersDAO::countUsers()`.
     *
     * @param {Object} query    The query string (from `request.query`) that we
     * wish to parse.
     * @param {string} query.name   (Optional) A string to compare to user's names for
     * matches.  Compared using trigram matching.
     * @param {int} quer.page    (Optional) A page number indicating which page of
     * results we want.
     * @param {string} query.sort (Optional) A sort parameter describing how we want
     * to sort users.
     * @param {Object} options  A dictionary of options that adjust how we
     * parse it.
     * @param {boolean} options.ignorePage  Skip the page parameter.  It will
     * still be in the result object and will default to `1`.
     *
     * @return {Object} A result object with the results in a form
     * understandable to `selectUsers()` and `countUsers()`.  Of the following
     * format:
     * ```
     * {
     *  where: 'WHERE ...', // An SQL where statement.
     *  params: [], // An array of paramters matching the $1,$2, parameterization of `where`
     *  page: 1, // A page parameter, to select which page of results we want.
     *  order: '', // An SQL order statement.
     *  emptyResult: false // When `true` we can skip the selectUsers() call,
     *  // because we know we have no results to return.
     * }
     * ```
     */
    UserController.prototype.parseQuery = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result, count, and, and;
            return __generator(this, function (_a) {
                options = options || {
                    ignorePage: false
                };
                result = {
                    daoQuery: {
                        where: '',
                        params: [],
                        page: 1
                    },
                    emptyResult: false,
                    requestedRelations: query.relations ? query.relations : []
                };
                if (!query) {
                    return [2 /*return*/, result];
                }
                count = 0;
                if (query.name && query.name.length > 0) {
                    count += 1;
                    and = count > 1 ? ' AND ' : '';
                    result.daoQuery.where += "".concat(and, " SIMILARITY(users.name, $").concat(count, ") > 0");
                    result.daoQuery.params.push(query.name);
                    result.daoQuery.order = peerreview_backend_1.DAOQueryOrder.Override;
                    result.daoQuery.orderOverride = "SIMILARITY(users.name, $".concat(count, ") desc");
                    // TODO We have access to the name here, but if we're paging with DISTINCT we don't want to allow
                    // arbitrary orders.  This is a problem.
                }
                if (query.ids && query.ids.length > 0) {
                    count += 1;
                    and = count > 1 ? ' AND ' : '';
                    result.daoQuery.where += "".concat(and, " users.id = ANY($").concat(count, "::bigint[])");
                    result.daoQuery.params.push(query.ids);
                }
                if (query.page && !options.ignorePage) {
                    result.daoQuery.page = query.page;
                }
                else if (!options.ignorePage) {
                    result.daoQuery.page = 1;
                }
                return [2 /*return*/, result];
            });
        });
    };
    /**
     * GET /users
     *
     * Respond with a list of `users` matching the query in the meta/result
     * format.
     */
    UserController.prototype.getUsers = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, daoQuery, emptyResult, requestedRelations, meta, daoResult, relations, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.parseQuery(query)];
                    case 1:
                        _a = _b.sent(), daoQuery = _a.daoQuery, emptyResult = _a.emptyResult, requestedRelations = _a.requestedRelations;
                        if (emptyResult) {
                            return [2 /*return*/, {
                                    dictionary: {},
                                    list: [],
                                    meta: {
                                        count: 0,
                                        page: 1,
                                        pageSize: 1,
                                        numberOfPages: 1
                                    },
                                    relations: {}
                                }];
                        }
                        return [4 /*yield*/, this.userDAO.countUsers(daoQuery)];
                    case 2:
                        meta = _b.sent();
                        return [4 /*yield*/, this.userDAO.selectCleanUsers(daoQuery)];
                    case 3:
                        daoResult = _b.sent();
                        return [4 /*yield*/, this.getRelations(daoResult, requestedRelations)];
                    case 4:
                        relations = _b.sent();
                        result = {
                            dictionary: daoResult.dictionary,
                            list: daoResult.list,
                            meta: meta,
                            relations: relations
                        };
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * POST /users
     *
     * Create a new `user`.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The user definition.
     * @param {string} request.body.email   The user's email.
     * @param {string} request.body.name    The users's name.
     * @param {string} request.body.password    (Optional) The user's password.  Required if no user is logged in.
     * @param {string} request.body.institution (Optional) The user's institution.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    UserController.prototype.postUsers = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var user, loggedInUser, userExistsResults, _a, error_1, createdUserResults, createdUser, token, _b, token, _c, results, relations;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        user = request.body;
                        loggedInUser = request.session.user;
                        user.email = user.email.toLowerCase();
                        return [4 /*yield*/, this.database.query('SELECT id, email FROM users WHERE email=$1', [user.email])
                            // 1. request.body.email must not already be attached to a user in the
                            // database.
                        ];
                    case 1:
                        userExistsResults = _d.sent();
                        // 1. request.body.email must not already be attached to a user in the
                        // database.
                        if (userExistsResults.rowCount > 0) {
                            throw new ControllerError_1.ControllerError(409, 'user-exists', "Attempting to create a user(".concat(userExistsResults.rows[0].id, ") that already exists!"));
                        }
                        // If we're creating a user with a password, then this is just a normal
                        // unconfirmed user creation.  However, if we're creating a user
                        // without a password, then this is a user who is being invited.
                        //
                        // Corresponds to:
                        // Validation: 2. Invitation => no password needed
                        // Validation: 3. Registration => must include password
                        if (user.password && !loggedInUser) {
                            user.password = this.auth.hashPassword(user.password);
                            user.status = 'unconfirmed';
                        }
                        else if (loggedInUser) {
                            user.status = 'invited';
                        }
                        else {
                            throw new ControllerError_1.ControllerError(400, 'bad-data:no-password', "Users creating accounts must include a password!");
                        }
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 5]);
                        _a = user;
                        return [4 /*yield*/, this.userDAO.insertUser(user)];
                    case 3:
                        _a.id = _d.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _d.sent();
                        if (error_1 instanceof backend.DAOError) {
                            // `insertUser()` check both of the following:
                            // 4. request.body.name is required.
                            // 5. request.body.email is required. 
                            if (error_1.type == 'name-missing') {
                                throw new ControllerError_1.ControllerError(400, 'bad-data:no-name', error_1.message);
                            }
                            else if (error_1.type == 'email-missing') {
                                throw new ControllerError_1.ControllerError(400, 'bad-data:no-email', error_1.message);
                            }
                            else {
                                throw error_1;
                            }
                        }
                        else {
                            throw error_1;
                        }
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, this.userDAO.selectUsers('WHERE users.id=$1', [user.id])];
                    case 6:
                        createdUserResults = _d.sent();
                        if (!createdUserResults.dictionary[user.id]) {
                            throw new ControllerError_1.ControllerError(500, 'server-error', "No user found after insertion. Looking for id ".concat(user.id, "."));
                        }
                        createdUser = createdUserResults.dictionary[user.id];
                        if (!loggedInUser) return [3 /*break*/, 9];
                        token = this.tokenDAO.createToken('invitation');
                        token.userId = createdUser.id;
                        _b = token;
                        return [4 /*yield*/, this.tokenDAO.insertToken(token)];
                    case 7:
                        _b.id = _d.sent();
                        return [4 /*yield*/, this.emailService.sendInvitation(loggedInUser, createdUser, token)];
                    case 8:
                        _d.sent();
                        return [3 /*break*/, 12];
                    case 9:
                        token = this.tokenDAO.createToken('email-confirmation');
                        token.userId = createdUser.id;
                        _c = token;
                        return [4 /*yield*/, this.tokenDAO.insertToken(token)];
                    case 10:
                        _c.id = _d.sent();
                        return [4 /*yield*/, this.emailService.sendEmailConfirmation(createdUser, token)];
                    case 11:
                        _d.sent();
                        _d.label = 12;
                    case 12: return [4 /*yield*/, this.settingsDAO.initializeSettingsForUser(createdUser)];
                    case 13:
                        _d.sent();
                        return [4 /*yield*/, this.userDAO.selectCleanUsers('WHERE users.id=$1', [user.id])];
                    case 14:
                        results = _d.sent();
                        if (!results.dictionary[user.id]) {
                            throw new ControllerError_1.ControllerError(500, 'server-error', "No user found after insertion. Looking for id ".concat(user.id, "."));
                        }
                        return [4 /*yield*/, this.getRelations(results)];
                    case 15:
                        relations = _d.sent();
                        return [2 /*return*/, response.status(201).json({
                                entity: results.dictionary[user.id],
                                relations: relations
                            })];
                }
            });
        });
    };
    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    UserController.prototype.getUser = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var results, relations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userDAO.selectCleanUsers('WHERE users.id = $1', [request.params.id])];
                    case 1:
                        results = _a.sent();
                        if (!results.dictionary[request.params.id]) {
                            throw new ControllerError_1.ControllerError(404, 'not-found', "User(".concat(request.params.id, ") not found."));
                        }
                        return [4 /*yield*/, this.getRelations(results)];
                    case 2:
                        relations = _a.sent();
                        return [2 /*return*/, response.status(200).json({
                                entity: results.dictionary[request.params.id],
                                relations: relations
                            })];
                }
            });
        });
    };
    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     *
     * NOT IMPLEMENTED.
     */
    UserController.prototype.putUser = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // We're not using this right now and can't think of a situation where
                // we would use it.  So for now, it's being marked unimplemented and
                // ignored.  
                throw new ControllerError_1.ControllerError(501, 'not-implemented', "Attempt to call unimplemented PUT /user for user(".concat(request.params.id, ")."));
            });
        });
    };
    /**
     * PATCH /user/:id
     *
     * Update an existing user from a patch.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to update.
     * @param {Object} request.body The patch we wish to user to update the
     * user.  May include any fields from the `user` object.  Some fields come
     * with additional requirements, noted below.
     * @param {string} request.body.password    (Optional) If this field is
     * included then the body must also include either an `oldPassword` field
     * or a `token` corresponding to either a valid 'reset-password' token or a
     * valid 'invitation' token.
     * @param {string} request.body.token Required if `request.body.password`
     * is included and `request.body.oldPassword` is not.
     * @param {string} request.body.oldPassword Required if
     * `request.body.password` is included and `request.body.token` is not.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    UserController.prototype.patchUser = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var user, id, existingUsers, existingUser, token, error_2, existingUserId, error_3, _a, existingUserId, error_4, results, token, _b, relations;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        user = request.body;
                        id = request.params.id;
                        /*************************************************************
                         * Permissions Checking and Input Validation
                         *
                         * Permissions:
                         * 1. User must be logged in.
                         * 2. User being patched must be the same as the logged in user.
                         * 2a. :id must equal request.session.user.id
                         * 2b. :id must equal request.body.id
                         * 3. User(:id) must exist.
                         * 4. If a password is included, then oldPassword or a valid token are
                         * required.
                         * 5. If an email is included, then oldPassword is required.
                         *
                         * **********************************************************/
                        // 1. User must be logged in.
                        if (!request.session.user) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized', "Unauthenticated user attempting to update user(".concat(user.id, ")."));
                        }
                        // 2. User being patched must be the same as the logged in user.
                        // 2a. :id must equal request.session.user.id
                        //
                        // NOTE: If this requirement changes (to allow admins to patch users,
                        // for instance), then make sure to strip the email out of the returned
                        // user at the botton of this function.  Or at least, spend some time
                        // considering whether you need to.
                        if (request.session.user.id != id) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized', "User(".concat(request.session.user.id, ") attempted to update another user(").concat(id, ")."));
                        }
                        // 2. User being patched must be the same as the logged in user.
                        // 2b. :id must equal request.body.id
                        if (id != user.id) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized:id-mismatch', "User(".concat(id, ") attempted to update another User(").concat(user.id, ")."));
                        }
                        return [4 /*yield*/, this.userDAO.selectUsers("WHERE users.id = $1", [id])
                            // 3. User(:id) must exist.
                            // If they don't exist, something is really, really wrong -- since they
                            // are logged in and in the session!
                        ];
                    case 1:
                        existingUsers = _c.sent();
                        // 3. User(:id) must exist.
                        // If they don't exist, something is really, really wrong -- since they
                        // are logged in and in the session!
                        if (!existingUsers.dictionary[id]) {
                            throw new ControllerError_1.ControllerError(500, 'server-error', "User(".concat(id, ") attempted to update themselves, but we couldn't find their database record!"));
                        }
                        existingUser = existingUsers.dictionary[id];
                        if (!user.password) return [3 /*break*/, 15];
                        if (!user.token) return [3 /*break*/, 7];
                        token = null;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.tokenDAO.validateToken(user.token, ['reset-password', 'invitation'])];
                    case 3:
                        token = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _c.sent();
                        if (error_2 instanceof backend.DAOError) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', error_2.message);
                        }
                        else {
                            throw error_2;
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        if (token.userId != user.id) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', "User(".concat(user.id, ") attempted to change their password with a valid token that wasn't theirs!"));
                        }
                        // If this was an invitation token, then we need to update their status.
                        if (token.type == 'invitation') {
                            user.status = 'confirmed';
                        }
                        return [4 /*yield*/, this.tokenDAO.deleteToken(token)
                            // Token was valid.  Clean it off the user object before we use
                            // it as a patch.
                        ];
                    case 6:
                        _c.sent();
                        // Token was valid.  Clean it off the user object before we use
                        // it as a patch.
                        delete user.token;
                        return [3 /*break*/, 13];
                    case 7:
                        if (!user.oldPassword) return [3 /*break*/, 12];
                        _c.label = 8;
                    case 8:
                        _c.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.auth.authenticateUser({
                                email: request.session.user.email,
                                password: user.oldPassword
                            })];
                    case 9:
                        existingUserId = _c.sent();
                        if (existingUserId != user.id) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', "User(".concat(user.id, ") gave credentials that matched User(").concat(existingUserId, ")!"));
                        }
                        // OldPassword was valid and the user successfully
                        // authenticated. Now clean it off the user object before
                        // we use it as a patch.
                        delete user.oldPassword;
                        return [3 /*break*/, 11];
                    case 10:
                        error_3 = _c.sent();
                        if (error_3 instanceof backend.ServiceError) {
                            if (error_3.type == 'authentication-failed' || error_3.type == 'no-user' || error_3.type == 'no-user-password') {
                                throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', error_3.message);
                            }
                            else if (error_3.type == 'multiple-users') {
                                throw new ControllerError_1.ControllerError(400, 'multiple-users', error_3.message);
                            }
                            else if (error_3.type == 'no-credential-password') {
                                throw new ControllerError_1.ControllerError(400, 'no-password', error_3.message);
                            }
                            else {
                                throw error_3;
                            }
                        }
                        else {
                            throw error_3;
                        }
                        return [3 /*break*/, 11];
                    case 11: return [3 /*break*/, 13];
                    case 12: throw new ControllerError_1.ControllerError(403, 'authentication-failure', "User(".concat(user.id, ") attempted to change their password with out reauthenticating."));
                    case 13:
                        _a = user;
                        return [4 /*yield*/, this.auth.hashPassword(user.password)];
                    case 14:
                        _a.password = _c.sent();
                        _c.label = 15;
                    case 15:
                        if (!user.email) return [3 /*break*/, 21];
                        if (!user.oldPassword) return [3 /*break*/, 20];
                        _c.label = 16;
                    case 16:
                        _c.trys.push([16, 18, , 19]);
                        return [4 /*yield*/, this.auth.authenticateUser({
                                email: request.session.user.email,
                                password: user.oldPassword
                            })];
                    case 17:
                        existingUserId = _c.sent();
                        if (existingUserId != user.id) {
                            throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', "User(".concat(user.id, ") gave credentials that matched User(").concat(existingUserId, ")!"));
                        }
                        // We're about to change their email, so the new email is
                        // unconfirmed. Make sure to update the status.
                        user.status = 'unconfirmed';
                        // OldPassword was valid and the user successfully
                        // authenticated. Now clean it off the user object before
                        // we use it as a patch.
                        delete user.oldPassword;
                        return [3 /*break*/, 19];
                    case 18:
                        error_4 = _c.sent();
                        if (error_4 instanceof backend.ServiceError) {
                            if (error_4.type == 'authentication-failed' || error_4.type == 'no-user' || error_4.type == 'no-user-password') {
                                throw new ControllerError_1.ControllerError(403, 'not-authorized:authentication-failure', error_4.message);
                            }
                            else if (error_4.type == 'multiple-users') {
                                throw new ControllerError_1.ControllerError(400, 'multiple-users', error_4.message);
                            }
                            else if (error_4.type == 'no-credential-password') {
                                throw new ControllerError_1.ControllerError(400, 'no-password', error_4.message);
                            }
                            else {
                                throw error_4;
                            }
                        }
                        else {
                            throw error_4;
                        }
                        return [3 /*break*/, 19];
                    case 19: return [3 /*break*/, 21];
                    case 20: throw new ControllerError_1.ControllerError(403, 'authentication-failure', "User(".concat(user.id, ") attempted to change their password with out reauthenticating."));
                    case 21:
                        // We only need the Id.
                        if (user.file) {
                            user.fileId = user.file.id;
                            delete user.file;
                        }
                        else if (user.file !== undefined) {
                            delete user.file;
                        }
                        return [4 /*yield*/, this.userDAO.updatePartialUser(user)
                            // Issue #132 - We're going to allow the user's email to be returned in this case,
                            // because only authenticated users may call this endpoint and then
                            // only on themselves.
                        ];
                    case 22:
                        _c.sent();
                        return [4 /*yield*/, this.userDAO.selectUsers('WHERE users.id=$1', [user.id])];
                    case 23:
                        results = _c.sent();
                        if (!results.dictionary[user.id]) {
                            throw new ControllerError_1.ControllerError(500, 'server-error', "Failed to find user(".concat(user.id, ") after update!"));
                        }
                        // If we get to this point, we know the user being updated is the same
                        // as the user in the session.  No one else is allowed to update the
                        // user.
                        request.session.user = results.dictionary[user.id];
                        if (!(results.dictionary[user.id].email != existingUser.email)) return [3 /*break*/, 26];
                        token = this.tokenDAO.createToken('email-confirmation');
                        token.userId = results.dictionary[user.id].id;
                        _b = token;
                        return [4 /*yield*/, this.tokenDAO.insertToken(token)];
                    case 24:
                        _b.id = _c.sent();
                        return [4 /*yield*/, this.emailService.sendEmailConfirmation(results.dictionary[user.id], token)];
                    case 25:
                        _c.sent();
                        _c.label = 26;
                    case 26: return [4 /*yield*/, this.getRelations(results)];
                    case 27:
                        relations = _c.sent();
                        return [2 /*return*/, response.status(200).json({
                                entity: results.dictionary[user.id],
                                relations: relations
                            })];
                }
            });
        });
    };
    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     *
     * TODO TECHDEBT This probably needs to check to see if the user we're
     * deleting is also the session user and then delete the session if they
     * are.
     *
     * NOT IMPLEMENTED.
     *
     * TODO Eventually we'll need to implement this for GDPR compliance, but we
     * need to figure out how to handle it first, since we don't want to let
     * users delete their papers once published.
     */
    UserController.prototype.deleteUser = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Currently leaving this unimplemented.  We will someday want to allow
                // users to delete themselves.  Probably some day soon.  But it is not
                // this day.  Trying to reduce the maintenance surface by removing
                // anything we're not actively using for now.
                throw new ControllerError_1.ControllerError(501, 'not-implemented', "Attempt to delete User(".concat(request.params.id, ")."));
            });
        });
    };
    return UserController;
}());
exports.UserController = UserController;
