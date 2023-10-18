/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/

/**
 * Field Entities
 *
 * @see packages/backend/daos/FieldDAO.js -> hydrateFields()
 */
const fields = {
    1: {
        id: 1,
        name: 'biology',
        description: 'Study of life.',
        type: 'biology',
        depth: 1,
        averageReputation: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    2: {
        id: 2,
        name: 'genetics',
        description: 'Study of genes and DNA.',
        type: 'biology',
        depth: 2,
        averageReputation: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }

}

/**
 * Unclean User Entities
 *
 * These are users that have all of their data, including private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const usersUnclean = {
    1: {
        id: 1,
        orcidId: null,
        name: 'James Watson',
        email: 'jwatson@university.edu',
        status: 'confirmed',
        permissions: 'user',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: []
    },
    2: {
        id: 2,
        orcidId: null,
        name: 'Francis Crick',
        email: 'fcrick@university.edu',
        status: 'confirmed',
        permissions: 'user',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: [] 
    },
    3: {
        id: 3,
        orcidId: null,
        name: 'Rosalind Franklin',
        email: 'rfranklin@university.edu',
        status: 'confirmed',
        permissions: 'user',
        file: null,
        bio: 'Should probably have been given more credit for the discovery of the structure of DNA.',
        location: '',
        institution: '',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: []
    }
}

/**
 * Cleaned User Entities
 *
 * These are users that have been stripped of private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const usersCleaned = {
    1: {
        id: 1,
        orcidId: null,
        name: 'James Watson',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: []
    },
    2: {
        id: 2,
        orcidId: null,
        name: 'Francis Crick',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: []
    },
    3: {
        id: 3,
        orcidId: null,
        name: 'Rosalind Franklin',
        file: null,
        bio: 'Should probably have been given more credit for the discovery of the structure of DNA.',
        location: '',
        institution: '',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        memberships: []
    }
}

/**
 * File Entities
 *
 * @see packages/backend/daos/FileDAO.js -> hydrateFiles()
 */
const files = {
    1: { 
        id: 1,
        userId: 1,
        filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        location: 'https://spaces-bucket-url.digitalocean.com',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    2: { 
        id: 2,
        userId: 1,
        filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        location: 'https://spaces-bucket-url.digitalocean.com',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'

    }
}

/**
 * Paper Entities
 *
 * @see packages/backend/daos/PaperDAO.js -> hydratePapers()
 */
const papers = {
    1: {
        id: 1,
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                userId: 1,
                order: 1,
                owner: true
            },
            {
                userId: 2,
                order: 2,
                owner: false 
            }
        ],
        fields: [
            fields[0],
            fields[1]
        ],
        versions: [
            {
                version: 1,
                file: files[0],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            },
            {
                version: 2,
                file: files[1],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            }
        ]
    },
    2: {
        id: 2,
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: true,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                userId: 1,
                order: 1,
                owner: true
            },
            {
                userId: 2,
                order: 2,
                owner: false 
            }
        ],
        fields: [
            fields[0],
            fields[1]
        ],
        versions: [
            {
                version: 1,
                file: files[0],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            },
            {
                version: 2,
                file: files[1],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

/**
 * Paper Comment Entities
 *
 * @see packages/backend/daos/PaperCommentDAO.js -> hydratePaperComment()
 */
const paperComments = {
    1: {
        id: 1,
        paperId: 1,
        userId: 1,
        status: 'committed',
        content: 'This is comment text.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        committedDate: 'TIMESTAMP'
    },
    2: {
        id: 2,
        paperId: 1,
        userId: 2,
        status: 'committed',
        content: 'This is more comment text.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        committedDate: 'TIMESTAMP'
    },
    3: {
        id: 3, 
        paperId: 1,
        userId: 1,
        status: 'in-progress',
        content: 'This is further comment text.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        committedDate: 'TIMESTAMP'
    }
}

/**
 * Review Entities
 *
 * @see packages/backend/daos/ReviewDAO.js -> hydrateReviews()
 */
const reviews = {
    1: {
        id: 1,
        paperId: 1,
        userId: 3,
        version: 1,
        summary: 'Text.',
        recommendation: 'commentary',
        status: 'posted',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        threads: [
            {
                id: 1,
                reviewId: 1,
                pageg: 1,
                pinX: 10,
                pinY: 10,
                comments: [
                    {
                        id: 1,
                        threadId: 1,
                        userId: 3,
                        threadOrder: 1,
                        status: 'posted',
                        content: 'Text.',
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMETAMP'
                    },
                    {
                        id: 2,
                        threadId: 1,
                        userId: 1,
                        threadOrder: 2,
                        status: 'posted',
                        content: 'More text.',
                        createdDate: 'TIMETAMP',
                        updatedDate: 'TIMESTAMP'
                    }
                ]
            }

        ]
    },
    2: {
        id: 2,
        paperId: 2,
        userId: 1,
        version: 1,
        summary: 'Text.',
        recommendation: 'commentary',
        status: 'posted',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        threads: [
            {
                id: 1,
                reviewId: 1,
                pageg: 1,
                pinX: 10,
                pinY: 10,
                comments: [
                    {
                        id: 1,
                        threadId: 1,
                        userId: 1,
                        threadOrder: 1,
                        status: 'posted',
                        content: 'Text.',
                        createdDate: 'TIMESTAMP',
                        updatedDate: 'TIMETAMP'
                    },
                    {
                        id: 2,
                        threadId: 1,
                        userId: 3,
                        threadOrder: 2,
                        status: 'posted',
                        content: 'More text.',
                        createdDate: 'TIMETAMP',
                        updatedDate: 'TIMESTAMP'
                    }
                ]
            }

        ]
    }
}

/**
 * Journal Entities
 *
 * @see packages/backend/daos/JournalDAO.js -> hydrateJournals()
 */
const journals = {
    1: {
        id: 1,
        name: 'Journal One',
        description: 'A first test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        members: [
            {
                userId: 1,
                permissions: 'owner',
                order: 1,
                journalId: 1

            },
            {
                userId: 2,
                permissions: 'editor',
                order: 2,
                journalId: 1
            },
            {
                userId: 3,
                permissions: 'reviewer',
                order: 3,
                journalId: 1
            }
        ]
    },
    2: {
        id: 2,
        name: 'Journal Two',
        description: 'A second test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        members: [
            {
                userId: 2,
                permissions: 'owner',
                order: 1,
                journalId: 2
            },
            {
                userId: 1,
                permissions: 'editor',
                order: 2,
                journalId: 2
            },
            { 
                userId: 3,
                permissions: 'reviewer',
                order: 3,
                journalId: 2
            }
        ]
    },
    3: {
        id: 3,
        name: 'Journal Three',
        description: 'A third test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        members: [
            {
                userId: 1,
                permissions: 'owner',
                order: 1,
                journalId: 3

            },
            {
                userId: 3,
                permissions: 'reviewer',
                order: 2,
                journalId: 3
            }
        ]
    },
    4: {
        id: 4,
        name: 'Journal Four',
        description: 'A fourth test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        members: [
            {
                userId: 4,
                permissions: 'owner',
                order: 1,
                journalId: 4

            },
            {
                userId: 5,
                permissions: 'editor',
                order: 2,
                journalId: 4
            },
            {
                userId: 6,
                permissions: 'reviewer',
                order: 3,
                journalId: 4
            }
        ]
    }
}

/**
 * Journal Submission Entities
 *
 * @see packages/backend/daos/JournalSubmissionDAO.js -> hydrateJournalSubmissions()
 */
const journalSubmissions = {
    1: {
        id: 1,
        journalId: 1,
        paperId: 1,
        status: 'submitted',
        submitterId: 1,
        submitterComment: '',
        deciderId: 2,
        decisionComment: '',
        decisionDate: 'TIMESTAMP',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        reviewers: [],
        editors: []
    },
    2: {
        id: 2,
        journalId: 2,
        paperId: 2,
        status: 'in-review',
        submitterId: 2,
        submitterComment: '',
        deciderId: 3,
        decisionComment: '',
        decisionDate: 'TIMESTAMP',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        reviewers: [
            {
                userId: 1,
                assignedDate: 'TIMESTAMP',
                reviews: []
            },
            {
                userId: 2,
                assignedDate: 'TIMESTAMP',
                reviews: []
            }
        ],
        editors: [
            {
                userId: 1,
                assignedDate: 'TIMESTAMP'
            },
            {
                userId: 2,
                assignedDate: 'TIMESTAMP'
            }
        ]
    }
}


/**
 * Export the entities in the form of the `results` objects returned by our 
 * GET /resources endpoints.
 */
module.exports = {
    fields: {
        dictionary: fields,
        list: Object.values(fields),
        meta: {
            count: Object.keys(fields).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    users: {
        dictionary: usersCleaned,
        list: Object.values(usersCleaned),
        meta: {
            count: Object.keys(usersCleaned).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    usersUnclean: {
        dictionary: usersUnclean,
        list: Object.values(usersUnclean),
        meta: {
            count: Object.keys(usersUnclean).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    papers: {
        dictionary: papers,
        list: Object.values(papers),
        meta: {
            count: Object.keys(papers).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    paperComments: {
        dictionary: paperComments,
        list: Object.keys(paperComments).map((key) => parseInt(key)),
        meta: {
            count: Object.keys(paperComments).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    reviews: {
        dictionary: reviews,
        list: Object.values(reviews),
        meta: {
            count: Object.keys(reviews).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    journals: {
        dictionary: journals,
        list: Object.values(journals).map((j) => j.id),
        meta: {
            count: Object.keys(journals).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {
            'users': usersCleaned
        }
    },
    journalSubmissions: {
        dictionary: journalSubmissions,
        list: Object.values(journalSubmissions),
        meta: {
            count: Object.keys(journalSubmissions).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {
            journals: {
                1: journals[1],
                2: journals[2]
            }
        }
    }
}
