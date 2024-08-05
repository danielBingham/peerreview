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
import { Model, ModelDictionary } from "@journalhub/model"


export interface APIRelations { 
    [modelName: string]: ModelDictionary<Model> 
}

/**
 * Single entity results, returned by REST endpoints that return a single
 * entity.
 */
export interface APIEntityResult<Type extends Model> {

    /** The returned entity. **/
    entity: Type,

    /**
     * A dictionary of related models connected to `entity` in some way.
     * Keyed by Model name. 
     * **/
    relations: APIRelations 
}

/**
 * Metadata describing the results of a query, primarily used for paging but
 * could be extended with other kinds of metadata in the future.
 */
export interface APIQueryMeta { 
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
export interface APIQueryResult<Type extends Model> {

    /** A dictionary of the wrapped result models, keyed by `Type.id`. **/
    dictionary: ModelDictionary<Type>,

    /** 
     * An ordered list of the ids of the models stored in `Dictionary`.
     * Preserves query order. 
    * **/
    list: number[],

    /** Paging meta data for the query. **/
    meta: APIQueryMeta,

    /** 
     * A dictionary of `ModelDictionary` storing related objects that were
     * requested for, or should be included with, this query. Keyed by Model
     * name. 
     * **/
    relations: APIRelations 
}
