const Logger = require('../../logger')
const FeatureFlags = require('../../features')

const NotificationService = require('../../services/NotificationService')

const DatabaseFixtures = require('../fixtures/database')
const EntityFixtures = require('../fixtures/entities')

describe('NotificationService', function() {

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

    describe('sendNewVersion()', function() {
        it('should notify all authors other than the currentUser', async function() {
            core.database.query.mockReturnValue(undefined)

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue(null)
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-version',
                {
                    paper: EntityFixtures.papers.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })

        it('should notify assigned reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // Select journal_submission_reviewers
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 3 }, { user_id: 4 } ]  }) 
                // select journal_submission_editors
                .mockReturnValueOnce({ rowCount: 0, rows: []  }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue({
                    id: 1,
                    journalId: 1
                })
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors', 'editors', 'reviewers' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-version',
                {
                    paper: EntityFixtures.papers.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(3)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(3)
            expect(notificationService.createNotification.mock.calls[2][0]).toBe(4)
        })

        it('should notify assigned editors', async function() {
            core.database.query.mockReturnValue(undefined)
                // Select journal_submission_reviewers
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 3 }, { user_id: 4 } ]  }) 
                // select journal_submission_editors
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 4 }, { user_id: 5 } ]  }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue({
                    id: 1,
                    journalId: 1
                })
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors', 'editors', 'reviewers' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-version',
                {
                    paper: EntityFixtures.papers.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(4)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(3)
            expect(notificationService.createNotification.mock.calls[2][0]).toBe(4)
            expect(notificationService.createNotification.mock.calls[3][0]).toBe(5)
        })

        it('should notify preprint reviewers', async function() {
            core.database.query.mockReturnValue(undefined)
                // Select journal_submission_reviewers
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 3 }, { user_id: 4 } ]  }) 
                // select journal_submission_editors
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 4 }, { user_id: 5 } ]  }) 
                // Select reviews
                .mockReturnValueOnce({ rowCount: 3, rows: [ {user_id: 1 }, { user_id: 4 }, { user_id: 6 }]  }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue({
                    id: 1,
                    journalId: 1
                })
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'public' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-version',
                {
                    paper: EntityFixtures.papers.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(5)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(3)
            expect(notificationService.createNotification.mock.calls[2][0]).toBe(4)
            expect(notificationService.createNotification.mock.calls[3][0]).toBe(5)
            expect(notificationService.createNotification.mock.calls[4][0]).toBe(6)
        })
    })
    
    describe('sendNewReview()', function() {
        it('should notify authors', async function() {
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ 
                    rowCount: DatabaseFixtures.database.papers[1].length, 
                    rows: DatabaseFixtures.database.papers[1]
                })

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue(null)
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-review',
                {
                    review: EntityFixtures.reviews.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[0][1]).toBe('author:paper:new-review')
        })
    
        it('should notify editors when review is on submission', async function() {
             core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ 
                    rowCount: DatabaseFixtures.database.papers[1].length, 
                    rows: DatabaseFixtures.database.papers[1]
                })
                // select journal_submission_editors 
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 3 }, { user_id: 4 } ]  }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue({
                    id: 1,
                    journalId: 1
                })
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors', 'editors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-review',
                {
                    review: EntityFixtures.reviews.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(3)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(3)
            expect(notificationService.createNotification.mock.calls[0][1]).toBe('editor:submission:new-review')
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(4)
            expect(notificationService.createNotification.mock.calls[1][1]).toBe('editor:submission:new-review')
            expect(notificationService.createNotification.mock.calls[2][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[2][1]).toBe('author:submission:new-review')
        })
    
        it('should not notify authors if visibility does not allow it', async function() {
             core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ 
                    rowCount: DatabaseFixtures.database.papers[1].length, 
                    rows: DatabaseFixtures.database.papers[1]
                })
                // select journal_submission_editors 
                .mockReturnValueOnce({ rowCount: 2, rows: [ { user_id: 3 }, { user_id: 4 } ]  }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.submissionService = {
                getActiveSubmission: jest.fn().mockReturnValue({
                    id: 1,
                    journalId: 1
                })
            }
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'assigned-editors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'new-review',
                {
                    review: EntityFixtures.reviews.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(2)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(3)
            expect(notificationService.createNotification.mock.calls[0][1]).toBe('editor:submission:new-review')
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(4)
            expect(notificationService.createNotification.mock.calls[1][1]).toBe('editor:submission:new-review')
        })
    })

    describe('sendPaperSubmitted()', function() {
        it('should notify all authors other than currentUser', async function() {
            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'paper:submitted',
                {
                    paper: EntityFixtures.papers.dictionary[1] 
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    })

    describe('sendPaperPreprintPosted()', function() {
        it('should notify all authors other than currentUser', async function() {
            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'paper:preprint-posted',
                {
                    paper: EntityFixtures.papers.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    })

    describe('sendJournalInvited()', function() {
        it('should notify the invited member', async function() {
            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'journal:invited',
                {
                    member: EntityFixtures.journals.dictionary[1].members[1],
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    
        it('should not notify the currentUser', async function() {
            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'journal:invited',
                {
                    member: EntityFixtures.journals.dictionary[1].members[0],
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(0)
        })
    })

    describe('sendSubmissionNew()', function() {
        it('should notify authors', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: DatabaseFixtures.database.papers[1].length, 
                    rows: DatabaseFixtures.database.papers[1]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:new',
                {
                    submission: EntityFixtures.journalSubmissions.dictionary[1],
                    paperId: 1, 
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[0][1]).toBe('author:submission:new')
        })
        
        it('should notify editors', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: DatabaseFixtures.database.papers[1].length, 
                    rows: DatabaseFixtures.database.papers[1]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()
            notificationService.paperEventDAO = {
                selectEvents: jest.fn().mockReturnValue({
                    dictionary: {
                        1: { visibility: [ 'authors', 'editors' ] }
                    },
                    list: [ 1 ]
                })
            }

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:new',
                {
                    submission: EntityFixtures.journalSubmissions.dictionary[1],
                    paperId: 1, 
                    journal: EntityFixtures.journals.dictionary[4]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(3)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
            expect(notificationService.createNotification.mock.calls[0][1]).toBe('author:submission:new')
            expect(notificationService.createNotification.mock.calls[1][0]).toBe(4)
            expect(notificationService.createNotification.mock.calls[1][1]).toBe('editor:submission:new')
            expect(notificationService.createNotification.mock.calls[2][0]).toBe(5)
            expect(notificationService.createNotification.mock.calls[2][1]).toBe('editor:submission:new')
        })
    })

    describe('sendSubmissionReviewerAssigned()', function() {
        it('should notify the assigned reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:reviewer-assigned',
                {
                    reviewer: EntityFixtures.journals.dictionary[1].members[1],
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    
        it('should not notify the currentUser', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:reviewer-assigned',
                {
                    reviewer: EntityFixtures.journals.dictionary[1].members[0],
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(0)
        })
    })

    describe('sendSubmissionReviewerUnassigned()', function() {
        it('should notify the unassigned reviewer', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:reviewer-unassigned',
                {
                    reviewerId: EntityFixtures.journals.dictionary[1].members[1].userId,
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    
        it('should not notify the currentUser', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:reviewer-unassigned',
                {
                    reviewerId: EntityFixtures.journals.dictionary[1].members[0].userId,
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(0)
        })
    })

    describe('sendSubmissionEditorAssigned()', function() {
        it('should notify the assigned editor', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:editor-assigned',
                {
                    editor: EntityFixtures.journals.dictionary[1].members[1],
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    
        it('should not notify the currentUser', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:editor-assigned',
                {
                    editor: EntityFixtures.journals.dictionary[1].members[0],
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(0)
        })
    })

    describe('sendSubmissionEditorUnassigned()', function() {
        it('should notify the unassigned editor', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:editor-unassigned',
                {
                    editorId: EntityFixtures.journals.dictionary[1].members[1].userId,
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(1)
            expect(notificationService.createNotification.mock.calls[0][0]).toBe(2)
        })
    
        it('should not notify the currentUser', async function() {
            core.database.query.mockReturnValue(undefined)
                // select papers 
                .mockReturnValueOnce({ 
                    rowCount: 1, 
                    rows: [ { title: 'test' } ]
                }) 

            const notificationService = new NotificationService(core)

            notificationService.createNotification = jest.fn()

            await notificationService.sendNotifications(
                EntityFixtures.usersUnclean.dictionary[1],
                'submission:editor-unassigned',
                {
                    editorId: EntityFixtures.journals.dictionary[1].members[0].userId,
                    paperId: 1,
                    journal: EntityFixtures.journals.dictionary[1]
                }
            )

            expect(notificationService.createNotification.mock.calls).toHaveLength(0)
        })
    })
})
