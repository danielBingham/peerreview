/********************************************************************
 *
 * PaperEvents Migration
 *
 * Add the tables to support journals.
 *
 *
 ********************************************************************/

const MigrationError = require('../errors/MigrationError')

module.exports = class PaperEventsMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }


    /**
     * Do any setup necessary to initialize this migration.
     *
     * This *should not impact data*.  Only steps that have no impact or no
     * risk to user data should happen here.
     *
     * These steps also need to be fully backwards compatible, and
     * non-destructively rolled back.
     *
     * So here we can create a new table, add a column with null values to a
     * table (to be populated later), create a new ENUM, etc.
     */
    async initialize() {

        try {

            await this.database.query(`
CREATE TYPE paper_event_types AS ENUM(
    'paper:new-version', 
    'paper:preprint-posted',
    'paper:new-review', 
    'paper:comment-posted',
    'review:comment-reply-posted',
    'submission:new', 
    'submission:new-review',
    'submission:status-changed',
    'submission:reviewer-assigned',
    'submission:reviewer-unassigned',
    'submission:editor-assigned',
    'submission:editor-unassigned'
)
            `, [])

            await this.database.query(`
CREATE TYPE paper_event_visibility AS ENUM(
    'managing-editors',
    'editors',
    'assigned-editors',
    'reviewers',
    'assigned-reviewers',
    'corresponding-authors',
    'authors',
    'public'
)
            `, [])            

            await this.database.query(`
CREATE TABLE paper_events (
    id bigserial PRIMARY KEY,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    actor_id bigint REFERENCES users(id) NOT NULL,
    version int NOT NULL,
    type paper_event_types NOT NULL,
    visibility paper_event_visibility[] NOT NULL DEFAULT '{"managing-editors"}',
    event_date timestamptz,

    assignee_id bigint REFERENCES users(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT NULL,
    review_comment_id bigint REFERENCES review_comments(id) DEFAULT NULL,
    submission_id bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    new_status journal_submission_status DEFAULT NULL
)
            `, [])

            await this.database.query(`
ALTER TABLE paper_versions ADD COLUMN IF NOT EXISTS review_count int 
            `, [])

            await this.database.query(`
ALTER TABLE paper_versions ALTER COLUMN review_count SET DEFAULT 0
            `, [])

        } catch (error) {
            try {

                await this.database.query(`DROP TABLE IF EXISTS paper_events`, [])
                await this.database.query(`DROP TYPE IF EXISTS paper_event_types`, [])
                await this.database.query(`DROP TYPE IF EXISTS paper_event_visibility`, [])

                await this.database.query(`ALTER TABLE paper_versions DROP COLUMN review_count`, [])

            } catch (rollbackError) {
                console.error(error)
                console.error(rollbackError)
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            console.error(error)
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {

        try {
            await this.database.query(`DROP TABLE IF EXISTS paper_events`, [])
            await this.database.query(`DROP TYPE IF EXISTS paper_event_types`, [])
            await this.database.query(`DROP TYPE IF EXISTS paper_event_visibility`, [])

            await this.database.query(`ALTER TABLE paper_versions DROP COLUMN review_count`, [])
        } catch (error) {
            throw new MigrationError('no-rollback', error.message)
        }
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { 
        try {
            await this.database.query(`
UPDATE paper_versions SET review_count = ( 
    SELECT count(id) FROM reviews WHERE reviews.paper_id = paper_versions.paper_id AND reviews.version = paper_versions.version
)
            `, [])

            await this.database.query(`
UPDATE paper_authors SET submitter = true WHERE author_order = 1
            `, [])

            await this.database.query(`
INSERT INTO paper_events (paper_id, actor_id, version, type, event_date, review_id)
    SELECT paper_id, user_id as actor_id, version, 'paper:new-review' as type, updated_date as event_date, id as review_id FROM reviews
            `, [])

            await this.database.query(`
INSERT INTO paper_events (paper_id, actor_id, version, type, event_date)
    SELECT 
        paper_versions.paper_id, paper_authors.user_id, paper_versions.version, 'paper:new-version', paper_versions.created_date
    FROM paper_versions
        LEFT OUTER JOIN paper_authors ON paper_versions.paper_id = paper_authors.paper_id
    WHERE paper_authors.author_order = 1
            `, [])

            await this.database.query(`
INSERT INTO paper_events (paper_id, actor_id, version, type, event_date)
    SELECT
        papers.id, paper_authors.user_id, 1, 'paper:preprint-posted', papers.created_date
    FROM papers
        LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
    WHERE paper_authors.author_order = 1 AND papers.show_preprint = true
            `, [])

        } catch (error ) {
            try {
                await this.database.query(`UPDATE paper_versions SET review_count = 0`, [])
                await this.database.query(`DROP FROM paper_events`, [])
            } catch (rollbackError) {
                throw new MigrationError('no-rollback', error.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }

    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { 
        try {
            await this.database.query(`
UPDATE paper_versions SET review_count = 0
            `, [])
        } catch(error) {
            throw MigrationError('no-rollback', error.message)
        }
    }
}
