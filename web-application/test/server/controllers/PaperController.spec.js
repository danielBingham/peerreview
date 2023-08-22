const backend = require('@danielbingham/peerreview-backend')
const DAOError = backend.DAOError

const FeatureFlags = require('../../../server/features')

const PaperController = require('../../../server/controllers/PaperController')

const ControllerError = require('../../../server/errors/ControllerError')

const DatabaseFixtures = require('../fixtures/database')
const ExpectedFixtures = require('../fixtures/entities')

const fs = require('fs')

describe('PaperController', function() {

    // ====================== Fixture Data ====================================

    const database = DatabaseFixtures.database
    const expectedPapers = ExpectedFixtures.papers

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new backend.Logger(),
        config: {
            s3: {
                bucket_url: '',
                access_id: '',
                access_key: '',
                bucket: ''
            },
        },
        database: {
            query: jest.fn()
        },
        queue: null,
        features: new FeatureFlags() 
    }

    // Disable logging.
    core.logger.level = -1

    beforeEach(function() {
        core.database.query.mockReset()
        core.logger.level = -1 
    })

    xdescribe('.getPapers()', function() {
        it('should return 200 and the papers', async function() {
            core.database.query.mockReturnValue([]).mockReturnValueOnce({ rowCount: 8, rows: database.papers[1]}) 
                .mockReturnValueOnce({ rowCount: 2, rows: database.users[1]})
                .mockReturnValueOnce({ rowCount: 2, rows: database.users[2]})


            const paperController = new PaperController(core)

            const request = {
                session: {},
                query: {}
            }

            const response = new Response()
            await paperController.getPapers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual([ expectedPapers[0] ])

        })

        xit('should handle an authorId query', async function() {})
        xit('should handle a fields query', async function() {})
        xit('should handle an excluseFields query', async function() {})
        xit('should handle a searchString query', async function() {})
        xit('should only return the papers a user has permission to see', async function() {})

        it('should pass any errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const paperController = new PaperController(core)

            const request = {
                session: {},
                query: {}
            }

            const response = new Response()
            try {
                await paperController.getPapers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }

            expect.hasAssertions()
        })

    })

    xdescribe('.postPapers()', function() {
        // We'll come back to this test later.
        describe('handles an uploaded paper', function() {

            beforeEach(function() {
                for ( const version of submittedPapers[0].versions) {
                    const fromPath = process.cwd() + '/test/server/files/public/uploads' + version.file.filepath
                    const toPath = process.cwd() + '/test/server/files/public/uploads/files' + version.file.filepath
                    fs.copyFileSync(fromPath, toPath) 
                }
            })

            afterEach(function() {
                for ( const version of expectedPapers[0].versions) {
                    const path = process.cwd() + '/test/server/files/public' + version.file.filepath
                    fs.rmSync(path)
                }
            })

            it('should return 201 with the submitted paper', async function() {

                core.database.query.mockReturnValueOnce({rowCount: 1, rows: [ { id: 1 }]}) // insertPaper
                    .mockReturnValueOnce({rowCount:2, rows: [ ]}) // insertAuthors
                    .mockReturnValueOnce({rowCount:2, rows: [ ]}) // insertFields
                // insertVersion (1)
                    .mockReturnValueOnce({rowCount:1, rows: database.filesBefore[1]}) // selectFiles
                    .mockReturnValueOnce({rowCount:0, rows: [ ] }) // select MAX(version)
                    .mockReturnValueOnce({rowCount:1, rows: [ ]}) // insert version
                    .mockReturnValueOnce({rowCount:1, rows: [ ]}) // updateFile

                // insertVersion(2)
                    .mockReturnValueOnce({rowCount:1, rows: database.filesBefore[2]}) // selectFiles
                    .mockReturnValueOnce({rowCount:1, rows: [ { version: 2 } ] }) // select MAX(version)
                    .mockReturnValueOnce({rowCount:1, rows: [ ]}) // insertVersion
                    .mockReturnValueOnce({rowCount:1, rows: [ ]}) // updateFile

                    .mockReturnValueOnce({rowCount:8, rows: database.papers[1] }) // selectPaper
                    .mockReturnValueOnce({rowCount:2, rows: database.users[1] })
                    .mockReturnValueOnce({rowCount:2, rows: database.users[2] })

                const request = {
                    body: submittedPapers[0],
                    session: {
                        user: {
                            id: 1
                        }
                    }
                }

                const response = new Response()
                const paperController = new PaperController(core)
                paperController.paperDAO.fileService.base = '/test/server/files/' + paperController.paperDAO.fileService.base

                // Silence logging to supress a bunch of PDF.js warnings.
                const log = console.log  
                console.log = jest.fn()

                await paperController.postPapers(request, response)

                console.log = log

                expect(response.status.mock.calls[0][0]).toEqual(201)
                expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[0])
            })
        })

        it('should throw a ControllerError with 403 if no user is authenticated', async function() {
            const request = {
                body: submittedPapers[0]
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.postPapers(request, response)
            } catch (error ) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-authorized')
            }

            expect.hasAssertions()

        })

        it('should throw a ControllerError with 403 if the submitting user is not an owner', async function() {
            const request = {
                body: submittedPapers[0],
                session: {
                    user: {
                        id: 2
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.postPapers(request, response)
            } catch (error ) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-owner')
            }

            expect.hasAssertions()
        })

        it('should throw a DAOError if database returns rowCount=0 on insert', async function() {
            core.database.query.mockReturnValueOnce({rowCount: 0, rows: [] })

            const request = {
                body: submittedPapers[0],
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.postPapers(request, response)
            } catch (error ) {
                expect(error).toBeInstanceOf(DAOError)
            }

            expect.hasAssertions()

        })

        it('should pass thrown errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const request = {
                body: submittedPapers[0],
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.postPapers(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
            expect.hasAssertions()

        })

    })

    xdescribe('.getPaper()', function() {
        it('should return 200 and the requested paper', async function() {
            core.database.query.mockReturnValueOnce({rowCount:8, rows: database.papers[1]})
                .mockReturnValueOnce({rowCount: 2, rows: database.users[1]})
                .mockReturnValueOnce({rowCount: 2, rows: database.users[2]})

            const request = {
                params: {
                    id: 1
                },
                session: { }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[0])
        })

        it('should throw a ControllerError with 404 when the paper does not exist', async function() {
            core.database.query.mockReturnValue({rowCount:0, rows: []})
            const request = {
                params: {
                    id: 3
                },
                session: {}
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.getPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(404)
                expect(error.type).toEqual('not-found')
            }

            expect.hasAssertions()
        })

        it('should pass a thrown error on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.getPaper(request, response)
            } catch(error) {
                expect(error).toBeInstanceOf(Error)
            }

            expect.hasAssertions()
        })

    })

    xdescribe('putPaper()', function() {
        it('should return 501 `not-implemented`', async function() {
            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.putPaper(request, response)
            } catch(error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(501)
                expect(error.type).toEqual('not-implemented')
            }

            expect.hasAssertions()

        })


    })

    xdescribe('patchPaper()', function() {
        it('should construct update SQL and respond with 200 and the patched paper', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

            const request = {
                body: {
                    id: 2,
                    isDraft: false 
                },
                params: {
                    id: 2
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }
            const response = new Response()

            const paperController = new PaperController(core)
            await paperController.patchPaper(request, response)

            const expectedSQL = 'UPDATE papers SET is_draft = $1, updated_date = now() WHERE id = $2'
            const expectedParams = [ false, 2 ]

            const databaseCall = core.database.query.mock.calls[3]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(databaseCall[1]).toEqual(expectedParams)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[1])

        })

        it('should ignore the id in the body and use the id in request.params', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

            const request = {
                body: {
                    id: 3,
                    isDraft: false
                },
                params: {
                    id: 2
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            await paperController.patchPaper(request, response)

            const expectedSQL = 'UPDATE papers SET is_draft = $1, updated_date = now() WHERE id = $2'
            const expectedParams = [ false, 2 ]

            const databaseCall = core.database.query.mock.calls[3]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(databaseCall[1]).toEqual(expectedParams)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[1])

        })

        it('should throw ControllerError(401) if no user is authenticated', async function() {
            core.database.query.mockReturnValue({ rowCount: 0, rows: [] })

            const request = {
                body: {
                    id: 1,
                    isDraft: false
                },
                params: {
                    id: 1
                },
                session: {}
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(401)
                expect(error.type).toEqual(`not-authenticated`)
            }
            expect.hasAssertions()
        })

        it('should throw ControllerError(404) if the paper we are attempting to patch is not found', async function() {
            core.database.query.mockReturnValue({ rowCount: 0, rows: [] })

            const request = {
                body: {
                    id: 1,
                    isDraft: false
                },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(404)
                expect(error.type).toEqual(`not-found`)
            }
            expect.hasAssertions()
        })

        it('should throw ControllerError(403) if the patching user is not an owner', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

            const request = {
                body: {
                    id: 2,
                    isDraft: false
                },
                params: {
                    id: 2
                },
                session: {
                    user: {
                        id: 3
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual(`not-authorized:not-owner`)
            }
            expect.hasAssertions()
        })

        it('should throw ControllerError(403) if paper being patched is not a draft', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[1].length, rows: database.papers[1] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })

            const request = {
                body: {
                    id: 1,
                    isDraft: false
                },
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual(`not-authorized:published`)
            }
            expect.hasAssertions()
        })

        it('should throw DAOError if the update attempt failed', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const request = {
                body: {
                    id: 2,
                    isDraft: false
                },
                params: {
                    id: 2
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(DAOError)
                expect(error.type).toEqual(`update-failure`)
            }
            expect.hasAssertions()
        })

        it('should throw ControllerError(500) if the patched paper is not found after patching', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: database.papers[2].length, rows: database.papers[2] })
                .mockReturnValueOnce({ rowCount: database.users[1].length, rows: database.users[1] })
                .mockReturnValueOnce({ rowCount: database.users[2].length, rows: database.users[2] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const request = {
                body: {
                    id: 2,
                    isDraft: false
                },
                params: {
                    id: 2
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(500)
                expect(error.type).toEqual(`server-error`)
            }
            expect.hasAssertions()
        })

        it('should pass thrown errors on to the error handler', async function() {
            core.database.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const request = {
                body: submittedPapers[0],
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.patchPaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
            expect.hasAssertions()

        })

    })

    xdescribe('deletePaper()', function() {
        it('return `200` and the id of the deleted paper on success', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: 1, rows: [{ user_id: 1, owner: true }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [] })

            const request = {
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()

            const paperController = new PaperController(core)
            await paperController.deletePaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({paperId: 1})
        })

        it('should throw ControllerError(403) if no user is authenticated', async function() {
            const request = {
                params: {
                    id: 1
                },
                session: {
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.deletePaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-authorized')
            }
            expect.hasAssertions()
        })

        it('should throw ControllerError(403) if authenticated user is not owner', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: 0, rows: []  })

            const request = {
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 3
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.deletePaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(ControllerError)
                expect(error.status).toEqual(403)
                expect(error.type).toEqual('not-owner')
            }
            expect.hasAssertions()
        })

        it('should throw DAOError if delete returns no modified rows', async function() {
            core.database.query.mockReturnValueOnce({ rowCount: 1, rows: [{ user_id: 1, owner: true }] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const request = {
                params: {
                    id: 1
                },
                session: {
                    user: {
                        id: 1
                    }
                }
            }

            const response = new Response()
            const paperController = new PaperController(core)
            try {
                await paperController.deletePaper(request, response)
            } catch (error) {
                expect(error).toBeInstanceOf(DAOError)
                expect(error.type).toEqual('deletion-failed')
            }
            expect.hasAssertions()
        })
    })

})
