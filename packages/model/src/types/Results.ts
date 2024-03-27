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
export interface DatabaseResult<Type extends Model> {

    /** A Model dictionary containing `Type` keyed by `Type.id`. **/
    dictionary: ModelDictionary<Type>,

    /** A list of `Type` containing the same objects as `dictionary`, preserving query order. **/
    list: Type[],
}

/**
 * Single entity results, returned by REST endpoints that return a single
 * entity.
 */
export interface EntityResult<Type extends Model> {

    /** The returned entity. **/
    entity: Type,

    /**
     * A dictionary of related models connected to `entity` in some way.
     * Keyed by Model name. 
     * **/
    relations: { [modelName: string]: ModelDictionary<Model> }
}

/**
 * Page Metadata is used to page lists of results.
 */
export interface PageMetadata { 
    /**  The total number of results. **/
    count: number,

    /** The current page in the result set. **/
    page: number,

    /** The maximum number of results on a page. **/
    pageSize: number,

    /** The total number of pages. **/
    numberOfPages: number
}

/**
 * Query results, returned by REST endpoints that return pageable lists of
 * results.
 */
export interface QueryResult<Type extends Model> {

    /** A dictionary of the wrapped result models, keyed by `Type.id`. **/
    dictionary: ModelDictionary<Type>,

    /** An ordered list of the same models stored in `Dictionary`.  Preserves query order. **/
    list: Type[],

    /** Paging meta data for the query. **/
    meta: PageMetadata,

    /** 
     * A dictionary of `ModelDictionary` storing related objects that were
     * requested for, or should be included with, this query. Keyed by Model
     * name. 
     * **/
    relations: { [modelName: string]: ModelDictionary<Model> }
}
