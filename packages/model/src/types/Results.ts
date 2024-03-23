/******************************************************************************
 * Result Set Types
 *
 * Defines various result set types that will used in a variety of contexts.
 * All are intended to be used with our model types.
 *
 * Types:
 * - DatabaseResult: Returned by the DAOs.
 * - EntityResult: Returned by REST endpoints that respond with a single entity.
 * - QueryResult: Returned by REST endpoints that respond with lists of entities.
 * 
 * ****************************************************************************/

import { Model, ModelDictionary } from "./Model"

/**
 * An enum defining the different result types we define.
 */
export enum ResultType {
    Database = 'database',
    Entity = 'entity',
    Query = 'query'
}

/**
 * Database results, returned by DAOs.
 */
export interface DatabaseResult<T extends Model> {
    dictionary: ModelDictionary<T>,
    list: T[],
}

/**
 * Single entity results, returned by REST endpoints that return a single
 * entity.
 */
export interface EntityResult<T extends Model> {
    entity: T,
    relations: { [modelName: string]: ModelDictionary<Model> }
}

/**
 * Page Metadata is used to page lists of results.
 */
export interface PageMetadata { 
    count: number,
    page: number,
    pageSize: number,
    numberOfPages: number
}

/**
 * Query results, returned by REST endpoints that return pageable lists of
 * results.
 */
export interface QueryResult<T extends Model> {
    dictionary: ModelDictionary<T>,
    list: T[],
    meta: PageMetadata,
    relations: { [modelName: string]: ModelDictionary<Model> }
}
