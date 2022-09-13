
const users = {
    1: {
        id: 1,
        orcidId: '0000-0000-1234-5678',
        name: 'John Doe',
        email: 'john.doe@university.edu',
        bio: 'A professor in testing.',
        location: 'Earth, Sol System',
        institution: 'Planetary University',
        reputation: '1024',
        createdDate: 'DATETIME',
        updatedDate: 'DATETIME'
    },
    2: {
        id: 2,
        orcidId: '0000-0000-1234-5679',
        name: 'Jane Doe',
        email: 'jane.doe@university.edu',
        bio: 'A professor in testing.',
        location: 'Earth, Sol System',
        institution: 'Planetary University',
        reputation: '2048',
        createdDate: 'DATETIME',
        updatedDate: 'DATETIME'
    }
}

const settings = {
    1: {
        id: 1,
        userId: 1,
        welcomeDismissed: false,
        fundingDismissed: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        fields: []
    },
    2: {
        id: 2,
        userId: 2,
        welcomeDismissed: true,
        fundingDismissed: true,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        fields: []
    }
}

export const backend = {
    users: {
        dictionary: users,
        list: Object.values(users)
    },
    settings: {
        dictionary: settings,
        list: Object.values(settings)
    }
}

