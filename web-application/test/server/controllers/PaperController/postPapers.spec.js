const { Logger, FeatureFlags, DatabaseFixtures, DAOError } = require('@danielbingham/peerreview-backend')
const { Paper, PaperFixtures } = require('@danielbingham/peerreview-model')

const PaperController = require('../../../../server/controllers/PaperController')

const ControllerError = require('../../../../server/errors/ControllerError')

describe('PaperController.postPapers()', function() {

    // ====================== Fixture Data ====================================

    const database = DatabaseFixtures.database
    const papers = PaperFixtures

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new Logger(),
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
        postmarkClient: {
            sendEmail: jest.fn()
        },
        features: new FeatureFlags() 
    }

    // Disable logging.
    core.logger.level = -1

    beforeEach(function() {
        core.database.query.mockReset()
        core.logger.level = -1 
    })


    it('should throw a ControllerError with 401 if no user is authenticated', async function() {
        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(401)
            expect(error.type).toEqual('not-authenticated')
        }

        expect.hasAssertions()
    })

    it(`should throw 403:not-authorized if the submitting user doesn't have 'create' permissions`, async function() {
        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission },
            session: {
                user: { id: 1 }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(false),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual('not-authorized')
        }

        expect.hasAssertions()
    })

    it('should throw 400:no-authors when a paper is submitted without authors', async function() {
        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }
        request.body.authors = []

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('no-authors')
        }

        expect.hasAssertions()
    })

    it('should throw 403:not-author if the submitting user is not an author', async function() {
        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission },
            session: {
                user: {
                    id: 2
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(403)
            expect(error.type).toEqual('not-author')
        }

        expect.hasAssertions()
    })

    it('should throw 400:no-corresponding-author when a paper is submitted without a corresponding author', async function() {
        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }
        request.body.authors = [{ userId: 1, order: 1, role: 'author', submitter: true }]

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('no-corresponding-author')
        }

        expect.hasAssertions()
    })

    it('should throw 400:invalid-author when a paper is submitted without valid authors', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 0, rows: [] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('invalid-author:1')
        }

        expect.hasAssertions()
    })

    it('should throw 400:no-fields when a paper is submitted without fields', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }
        request.body.fields = []

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('no-fields')
        }

        expect.hasAssertions()
    })
    
    it('should throw 400:invalid-field when a paper is submitted with an invalid field', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('invalid-field:1')
        }

        expect.hasAssertions()
    })

    it('should throw 400:no-versions when a paper is submitted without versions', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }
        request.body.versions = []

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('no-versions')
        }

        expect.hasAssertions()
    })

    it('should throw 400:invalid-file error when the submitted file does not exist in the database', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('invalid-file:1')
        }

        expect.hasAssertions()
    })

    it('should throw 400:file-in-use error when a file is used on another paper', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [ { paper_id: 1, file_id: 1 }] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(ControllerError)
            expect(error.status).toEqual(400)
            expect(error.type).toEqual('file-in-use')
        }

        expect.hasAssertions()
    })

    it('should throw a DAOError if database returns rowCount=0 on insert', async function() {
        core.database.query.mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false)
        }

        try {
            await paperController.postPapers(request, response)
        } catch (error ) {
            expect(error).toBeInstanceOf(DAOError)
        }

        expect.hasAssertions()

    })

    it('should succeed with 201 and respond with the entity and relations', async function() {
        core.database.query
            // SELECT DISTINCT users.id FROM users WHERE user.id = ANY($1::bigint[]) 
            .mockReturnValueOnce({rowCount: 1, rows: [{ id: 1 }] })
            // SELECT DISTINCT fields.id from fields WHERE fields.id = ANY($1::bigint[]) 
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            // SELECT DISTINCT files.id FROM files WHERE files.id = ANY($1::bigint[])
            .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            // SELECT paper_versions.paper_id, paper_versions.file_id FROM paper_versions WHERE...
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

            // We're mocking the insertion methods at the DAO level since most of them don't return anything.
        
            // selectPapers()
            .mockReturnValueOnce({ rowCount: 1, rows: database.papers[1] }) 

        const testSubmission = papers.dictionary[1].toJSON()
        const request = {
            body: { ...testSubmission }, 
            session: {
                user: {
                    id: 1
                }
            }
        }

        const response = new Response()
        const paperController = new PaperController(core)
        paperController.permissionService = {
            can: jest.fn().mockReturnValue(true),
            canPublic: jest.fn().mockReturnValue(false),
            papers: {
                createRoles: jest.fn(),
                assignRoles: jest.fn()
            }
        }

        paperController.paperDAO.insertPaper = jest.fn().mockReturnValueOnce(1)
        paperController.paperDAO.insertAuthors = jest.fn()
        paperController.paperDAO.insertFields = jest.fn()
        paperController.paperDAO.insertVersions = jest.fn()

        paperController.paperEventService.createEvent = jest.fn()
        paperController.notificationService.sendNotifications = jest.fn()
        paperController.getRelations = jest.fn().mockReturnValue({})

        await paperController.postPapers(request, response)

        expect(response.status.mock.calls[0][0]).toEqual(201)
        expect(response.json.mock.calls[0][0]).toEqual({
            entity: papers.dictionary[1],
            relations: {}
        })

    })
})
