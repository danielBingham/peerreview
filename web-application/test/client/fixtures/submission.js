
export const users = {
    1: {
        name: 'John Doe',
        email: 'john.doe@university.edu',
        password: 'password',
        institution: 'Planetary University',
    },
    2: {
        name: 'Jane Doe',
        email: 'jane.doe@university.edu',
        password: 'A different password.',
        institution: 'Planetary University',
    }
}

export const journals = {
    1: {
        name: 'Journal One',
        description: 'A test journal.',
        users: [
            {
                userId: 1,
                permissions: 'owner'
            }
        ]
    },
    2: {
        id: 2,
        name: 'Journal Two',
        description: 'A second test journal.',
        users: [
            {
                userId: 2,
                permissions: 'owner'
            }
        ]
    }
}

