"use strict";
const { Paper, PaperAuthor, PaperVersion } = require('./models/Paper');
exports.Paper = Paper;
exports.PaperAuthor = PaperAuthor;
exports.PaperVersion = PaperVersion;
const { File } = require('./models/File');
exports.File = File;
exports.PaperFixtures = require('./fixtures/Paper');
exports.FileFixtures = require('./fixtures/File');
