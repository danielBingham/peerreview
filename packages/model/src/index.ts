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
export { ResultType, EntityResult, QueryMeta, QueryResult} from './types/Query'

export { Field } from './types/Field'
export { File, PartialFile } from './types/File'
export { Paper, PartialPaper, PaperAuthor, PaperVersion } from './types/Paper'
export { Journal, JournalModel, JournalAnonymity, PartialJournal, JournalMember, JournalMemberPermissions } from './types/Journal'
export { JournalSubmission, PartialJournalSubmission, JournalSubmissionReviewer, JournalSubmissionReview, JournalSubmissionEditor } from './types/JournalSubmission'
export { Notification, NotificationType, PartialNotification } from './types/Notification'
export { PaperComment, PartialPaperComment } from './types/PaperComment'
export { PaperEvent, PaperEventVisibility, PartialPaperEvent, PaperEventType, PaperEventRootType } from './types/PaperEvent'
export { Permission } from './types/Permission'
export { Review, ReviewThread, ReviewComment, ReviewStatus, ReviewRecommendation } from './types/Review'
export { Token, PartialToken, TokenType } from './types/Token'
export { User, PartialUser, UserJournalMembership, UserStatus, UserPermissions } from './types/User'

export { getFieldFixture } from './fixtures/Field'
export { getFileFixture } from './fixtures/File'
export { getPaperFixture } from './fixtures/Paper'
export { getJournalFixture } from './fixtures/Journal'
export { getJournalSubmissionFixture } from './fixtures/JournalSubmission'
export { getNotificationFixture } from './fixtures/Notification'
