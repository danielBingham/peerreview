const PaperController = require('../../../server/controllers/papers')
const Logger = require('../../../server/logger')

describe('PaperController', function() {
    
    const logger = new Logger()
    // Disable logging.
    logger.level = -1 

    // ====================== Fixture Data ====================================

    const submittedPapers = [
        {
            title: 'Molecular Structure of Nucleic Acids',
            isDraft: false,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
            authors: [
                {
                    user: {
                        id: 1,
                        name: 'James Watson',
                        email: 'jwatson@university.edu',
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    },
                    order: 1,
                    owner: true
                },
                {
                    user: {
                        id: 2,
                        name: 'Francis Crick',
                        email: 'fcrick@university.edu',
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    },
                    order: 1,
                    owner: true
                }
            ],
            fields: [
                {
                    id: 1,
                    name: 'biology',
                    parentId: null,
                    createdDate: 'TIMESTAMP',
                    updatedDate: 'TIMESTAMP'
                },
                {
                    id: 2,
                    name: 'genetics',
                    parentId: 1,
                    createdDate: 'TIMESTAMP',
                    updatedDate: 'TIMESTAMP'
                }
            ],
            versions: []
        }
    ]

    const database = { 
        withVersions: [
            // Row 1
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 1,
                paper_filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 2
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 1,
                paper_filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 3
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 1,
                paper_filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 4
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 1,
                paper_filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 5
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 2,
                paper_filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 6
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 2,
                paper_filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 7
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 2,
                paper_filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 8
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                paper_version: 2,
                paper_filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            }
        ],
        withOutVersions: [
            // Row 1
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 2
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                field_id: 1,
                field_name: 'biology',
                field_parentId: null,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 3
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 2,
                author_order: 2,
                author_owner: false,
                author_name: 'Francis Crick',
                author_email: 'fcrick@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            },
            // Row 4
            {
                paper_id: 1,
                paper_title: 'Molecular Structure of Nucleic Acids',
                paper_isDraft: false,
                paper_createdDate: 'TIMESTAMP',
                paper_updatedDate: 'TIMESTAMP',
                author_id: 1,
                author_order: 1,
                author_owner: true,
                author_name: 'James Watson',
                author_email: 'jwatson@university.edu',
                author_createdDate: 'TIMESTAMP',
                author_updatedDate: 'TIMESTAMP',
                field_id: 2,
                field_name: 'genetics',
                field_parentId: 1,
                field_createdDate: 'TIMESTAMP',
                field_updatedDate: 'TIMESTAMP'
            }
        ]
    }

    const expectedPapers = {
        withVersions: [
            {
                id: 1,
                title: 'Molecular Structure of Nucleic Acids',
                isDraft: false,
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP',
                authors: [
                    {
                        user: {
                            id: 1,
                            name: 'James Watson',
                            email: 'jwatson@university.edu',
                            createdDate: 'TIMESTAMP',
                            updatedDate: 'TIMESTAMP'
                        },
                        order: 1,
                        owner: true
                    },
                    {
                        user: {
                            id: 2,
                            name: 'Francis Crick',
                            email: 'fcrick@university.edu',
                            createdDate: 'TIMESTAMP',
                            updatedDate: 'TIMESTAMP'
                        },
                        order: 2,
                        owner: false
                    }
                ],
                fields: [
                    {
                        id: 1,
                        name: 'biology',
                        parentId: null,
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    },
                    {
                        id: 2,
                        name: 'genetics',
                        parentId: 1,
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    }
                ],
                versions: [
                    {
                        version: 1,
                        filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf'
                    },
                    {
                        version: 2,
                        filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf'
                    }
                ]
            }
        ],
        withOutVersions: [
            {
                id: 1,
                title: 'Molecular Structure of Nucleic Acids',
                isDraft: false,
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP',
                authors: [
                    {
                        user: {
                            id: 1,
                            name: 'James Watson',
                            email: 'jwatson@university.edu',
                            createdDate: 'TIMESTAMP',
                            updatedDate: 'TIMESTAMP'
                        },
                        order: 1,
                        owner: true
                    },
                    {
                        user: {
                            id: 2,
                            name: 'Francis Crick',
                            email: 'fcrick@university.edu',
                            createdDate: 'TIMESTAMP',
                            updatedDate: 'TIMESTAMP'
                        },
                        order: 2,
                        owner: false
                    }
                ],
                fields: [
                    {
                        id: 1,
                        name: 'biology',
                        parentId: null,
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    },
                    {
                        id: 2,
                        name: 'genetics',
                        parentId: 1,
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMESTAMP'
                    }
                ],
                versions: []
            }
        ]

    }

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const connection = {
        query: jest.fn()
    }


    beforeEach(function() {
        connection.query.mockReset()
    })

    describe('.getPapers()', function() {
        it('should return 200 and the papers', async function() {
            connection.query.mockReturnValueOnce({ rowCount: 8, rows: database.withVersions }) 

            const paperController = new PaperController(connection, logger)

            const response = new Response()
            await paperController.getPapers(null, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers.withVersions)
            
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const paperController = new PaperController(connection, logger)

            const response = new Response()
            await paperController.getPapers(null, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })

    })

   describe('.postPapers()', function() {
       it('should return 201 with the submitted paper', async function() {

           connection.query.mockReturnValueOnce({rowCount: 1, rows: [ { id: 1 }]})
               .mockReturnValue({rowCount:2, rows: [ ]})
               .mockReturnValue({rowCount:2, rows: [ ]})
               .mockReturnValue({rowCount:4, rows: database.withOutVersions })

           const request = {
               body: submittedPapers[0]
           }

           const response = new Response()
           const paperController = new PaperController(connection, logger)
           await paperController.postPapers(request, response)

           expect(response.status.mock.calls[0][0]).toEqual(201)
           expect(response.json.mock.calls[0][0]).toEqual(expectedPapers.withOutVersions[0])
       })

       it('should return 500 and an unknown error if database returns rowCount=0 on insert', async function() {

           connection.query.mockReturnValueOnce({rowCount: 0, rows: [] })

           const request = {
               body: submittedPapers[0]
           }

           const response = new Response()
           const paperController = new PaperController(connection, logger)
           await paperController.postPapers(request, response)

           expect(response.status.mock.calls[0][0]).toEqual(500)
           expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
       })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('This is a test error!')
            })

            const request = {
                body: submittedPapers[0]
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.postPapers(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })

    })

    describe('.getPaper()', function() {
        it('should return 200 and the requested paper', async function() {
            connection.query.mockReturnValue({rowCount:8, rows: database.withVersions })
            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers.withVersions[0])
        })

        it('should return 404 when the paper does not exist', async function() {
            connection.query.mockReturnValue({rowCount:0, rows: []})
            const request = {
                params: {
                    id: 3
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(404)
            expect(response.json.mock.calls[0][0]).toEqual({})
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })

    })

    describe('putPaper()', function() {
       it('should return 200 and the modified paper', async function() {
           connection.query.mockReturnValue({ rowCount: 1, rows: [] })
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:8, rows: database.withVersions })

           // putPaper() modifies the paper object in the request body.
           const submittedPaper = {...submittedPapers[0]}
           const request = {
               body: submittedPaper,
               params: {
                   id: 1
               }
           }
           const response = new Response()
           const paperController = new PaperController(connection, logger)
           await paperController.putPaper(request, response)

           expect(response.status.mock.calls[0][0]).toEqual(200)
           expect(response.json.mock.calls[0][0]).toEqual(expectedPapers.withVersions[0])

        })

        it('should use request.params.id and ignore paper.id', async function() {
           connection.query.mockReturnValue({ rowCount: 1, rows: [] })
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:2, rows: []})
               .mockReturnValue({rowCount:8, rows: database.withVersions })

            // putPaper() modifies the paper.
           const submittedPaper = {...submittedPapers[0]}
           submittedPaper.id = 2
           const request = {
                body: submittedPaper,
                params: {
                    id: 1
                }
            }
            const response = new Response()

            const paperController = new PaperController(connection, logger)
            await paperController.putPaper(request, response)

            const databaseCall = connection.query.mock.calls[0]
            expect(databaseCall[1][2]).toEqual(request.params.id)


            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers.withVersions[0])
        })

        it('should return 404 when the paper does not exist', async function() {
            connection.query.mockReturnValue({rowCount:0, rows: []})

            // We want to do this because put modifies the paper object passed
            // to it.
            const submittedPaper = {...submittedPapers[0]}
            const request = {
                body: submittedPaper,
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(404)
            expect(response.json.mock.calls[0][0]).toEqual({})
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            connection.query.mockImplementation(function(sql, params) {
                throw new Error('Something went wrong!')
            })

            // Put modifies the paper object passed to it.
            const submittedPaper = {...submittedPapers[0]}
            const request = {
                body: submittedPaper,
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.getPaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })

    })

    xdescribe('patchPaper()', function() {
        it('should construct update SQL', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})

            // Fixture data.
            const submittedPaper = {
                name: 'John Doe',
                email: 'john.doe@email.com',
            }
            const request = {
                body: submittedPaper,
                params: {
                    id: 1
                }
            }
            const response = new Response()

            const paperController = new PaperController(connection, logger)
            await paperController.patchPaper(request, response)

            const expectedSQL = 'UPDATE papers SET name = $1 and email = $2 and updated_date = now() WHERE id = $3'
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ]

            const databaseCall = connection.query.mock.calls[0]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(databaseCall[1]).toEqual(expectedParams)

            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[0])

        })

        it('should ignore the id in the body and use the id in request.params', async function() {
            connection.query.mockReturnValue({rowCount:1, rows: [database[0]]})

            // Fixture data.
            const submittedPaper = {
                id: 2,
                name: 'John Doe',
                email: 'john.doe@email.com'
            }

            const request = {
                body: submittedPaper,
                params: {
                    id: 1
                }
            }

            const response = new Response()
            const paperController = new PaperController(connection, logger)
            await paperController.patchPaper(request, response)

            const expectedSQL = 'UPDATE papers SET name = $1 and email = $2 and updated_date = now() WHERE id = $3'
            const expectedParams = [ 'John Doe', 'john.doe@email.com', 1 ]

            const databaseCall = connection.query.mock.calls[0]
            expect(databaseCall[0]).toEqual(expectedSQL)
            expect(databaseCall[1]).toEqual(expectedParams)

            expect(response.json.mock.calls[0][0]).toEqual(expectedPapers[0])

        })

    })

    xdescribe('deletePaper()', function() {
        it('return `200` and the id of the deleted paper on success', async function() {
            connection.query.mockReturnValue({rowcount:1})

            const request = {
                params: {
                    id: 1
                }
            }

            const response = new Response()

            const paperController = new PaperController(connection, logger)
            await paperController.deletePaper(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({paperId: 1})
        })

    })

})
