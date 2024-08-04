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
    Dictionary = 'dictionary',
    Entity = 'entity',
    Query = 'query'
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
 * Metadata describing the results of a query, primarily used for paging but
 * could be extended with other kinds of metadata in the future.
 */
export interface QueryMeta { 
    /**  The total number of results. **/
    count: number,

    /** The current page in the result set. **/
    page: number,

    /** The maximum number of results on a page. **/
    pageSize: number,

    /** The total number of pages. **/
    numberOfPages: number
}

export interface QueryRelations { 
    [modelName: string]: ModelDictionary<Model> 
}


/**
 * Query results, returned by REST endpoints that return pageable lists of
 * results.
 */
export interface QueryResult<Type extends Model> {

    /** A dictionary of the wrapped result models, keyed by `Type.id`. **/
    dictionary: ModelDictionary<Type>,

    /** 
     * An ordered list of the ids of the models stored in `Dictionary`.
     * Preserves query order. 
    * **/
    list: number[],

    /** Paging meta data for the query. **/
    meta: QueryMeta,

    /** 
     * A dictionary of `ModelDictionary` storing related objects that were
     * requested for, or should be included with, this query. Keyed by Model
     * name. 
     * **/
    relations: QueryRelations
}
