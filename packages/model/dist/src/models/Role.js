"use strict";
/**
 * Represents a role that grants permissions on either a paper or a journal.
 * Must be associated with either a paper or a journal.
 */
module.exports = class Role {
    constructor(data) {
        /** The database id of this role. @type {number} **/
        this.id = null;
        /** The name of this role. @type {string} **/
        this.name = '';
        /** A short description of the role, used in place of the name to identify it. @type {string} **/
        this.shortDescription = '';
        /** The type of role. ENUM of public, author, editor, or reviewer. @type {string} **/
        this.type = '';
        /** A long description describing this role and its purpose. @type {string} **/
        this.description = '';
        /** For journalId and paperId, these are each optional but one of them must be set. **/
        /** OPTIONAL. The id of the journal this role grants permissions on. @type {number} **/
        this.journalId = null;
        /** OPTIONAL. The id of the paper this role grants permissions on. @type {number} **/
        this.paperId = null;
    }
    fromJSON(data) {
        this.id = data.id;
        this.name = data.name;
        this.shortDescription = data.shortDescription;
        this.type = data.type;
        this.description = data.description;
        this.journalId = data.journalId;
        this.paperId = data.paperId;
    }
    toJSON() {
        const data = {};
        data.id = this.id;
        data.name = this.name;
        data.shortDescription = this.shortDescription;
        data.type = this.type;
        data.description = this.description;
        data.journalId = this.journalId;
        data.paperId = this.paperId;
        return data;
    }
};
