export { Model } from './types/Model'
export { ModelDictionary, DatabaseResult, RestResult, PageMetadata, QueryResult} from './types/Results'
export { Paper, PaperAuthor, PaperVersion } from './types/Paper'
export { File } from './types/File'

import { queryResults as paperQueryResults, databaseResults as paperDatabaseResults } from './fixtures/Paper'
export const PaperFixtures = {
    query: paperQueryResults,
    database: paperDatabaseResults
}

import { queryResults as fileQueryResults, databaseResults as fileDatabaseResults } from './fixtures/File'
export const FileFixtures = {
    query: fileQueryResults,
    database: fileDatabaseResults
}
