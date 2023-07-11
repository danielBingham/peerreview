
const fields = [
    {
        id: 1,
        name: 'biology',
        description: 'Study of life.',
        type: 'biology',
        depth: 1,
        averageReputation: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    {
        id: 2,
        name: 'genetics',
        description: 'Study of genes and DNA.',
        type: 'biology',
        depth: 2,
        averageReputation: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }

]

const usersUnclean = [
    {
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
        updatedDate: 'TIMESTAMP'
    },
    {
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
        updatedDate: 'TIMESTAMP'
    }
]


const usersCleaned = [
    {
        id: 1,
        orcidId: null,
        name: 'James Watson',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    {
        id: 2,
        orcidId: null,
        name: 'Francis Crick',
        file: null,
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        reputation: 10,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
]

const files = [
    { 
        id: 1,
        userId: 1,
        filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        location: 'https://spaces-bucket-url.digitalocean.com',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    { 
        id: 2,
        userId: 1,
        filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        location: 'https://spaces-bucket-url.digitalocean.com',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'

    }
]

const papers = [
    {
        id: 1,
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                user: usersCleaned[0],
                order: 1,
                owner: true
            },
            {
                user: usersCleaned[1],
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
    {
        id: 2,
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: true,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                user: usersCleaned[0],
                order: 1,
                owner: true
            },
            {
                user: usersCleaned[1],
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
]

const journals = [
    {
        id: 1,
        name: 'Journal One',
        description: 'A first test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        users: [
            {
                userId: 1,
                permissions: 'owner'
            }
        ]
    },
    {
        id: 2,
        name: 'Journal Two',
        description: 'A second test journal.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        users: [
            {
                userId: 2,
                permissions: 'owner'
            }
        ]
    }
]


module.exports = {
    fields: fields,
    users: usersCleaned,
    usersUnclean: usersUnclean,
    papers: papers,
    journals: journals
}
