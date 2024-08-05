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
import { Model, ModelDictionary } from '@journalhub/model'

/** 
 * Defines the possible choices that can be used to order a DAOQuery. These
 * need to be predefined because the ORDER BY clause is linked to the DISTINCT
 * clause in the paging calls, and it can work in unintuitive ways. We
 * generally only need a few orders, so it's better just to predefine them to
 * force us to write queries we know will work as intended. 
 * 
 * NOTE: Not all DAOs support all the orders.
 */
export enum DAOQueryOrder { 
    Newest = 'newest',
    Oldest = 'oldest',
    MostActive = 'most-active',
    LeastActive = 'least-active',
    Heirarchy = 'heirarchy',
    Alphabetically = 'alphabetically',
    Similarity = 'similarity',
    Override = 'override'
}

/**
 * Defines a Database Query made to a DAO's `selectEntity` method.
 */
export interface DAOQuery {
    /** 
     * The WHERE portion of an SQL SELECT statement, parameterized for use
     * with pg's `Pool.query`. 
     **/
    where?: string

    /** An array of values matching the parameters of `where`. **/
    params?: any[]

    /** 
     * The ORDER portion of an SQL SELECT statement, parameterized for user
     * with pg's `Pool.query`. 
     **/
    order?: DAOQueryOrder 

    /**
     * Override the order string directly.
     */
    orderOverride?: string

    /** The number of the page of the query we're requesting. **/
    page?: number

    /** The number of items we want to retrieve in each page. **/
    itemsPerPage?: number

    /** If true, the query should return an empty result. TECHDEBT placed here to avoid needing a different type for parsed api queries. **/
    empty?: boolean
}

/**
 * Database results, returned by DAOs.
 */
export interface DAOResult<Type extends Model> {

    /** A Model dictionary containing `Type` keyed by `Type.id`. **/
    dictionary: ModelDictionary<Type>,

    /** A list of `Type` containing the same objects as `dictionary`, preserving query order. **/
    list: number[],
}
