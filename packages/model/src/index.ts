/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
export { Model, ModelDictionary } from './types/Model'
export { ResultType, DatabaseResult, EntityResult, QueryMeta, QueryResult} from './types/Results'

export { Field } from './types/Field'
export { File, PartialFile } from './types/File'
export { Paper, PaperAuthor, PaperVersion } from './types/Paper'
export { Journal, JournalModel, JournalAnonymity, PartialJournal, JournalMember, JournalMemberPermissions } from './types/Journal'
export { JournalSubmission, PartialJournalSubmission, JournalSubmissionReviewer, JournalSubmissionReview, JournalSubmissionEditor } from './types/JournalSubmission'

export { getFieldFixture } from './fixtures/Field'
export { getFileFixture } from './fixtures/File'
export { getPaperFixture } from './fixtures/Paper'
export { getJournalFixture } from './fixtures/Journal'
