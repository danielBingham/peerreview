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
/******************************************************************************
 * Universal methods for managing state.  These can be imported into a state
 * definition set as reducers on a redux slice.  They then provide the basic
 * state manipulation methods.
 ******************************************************************************/
import { PayloadAction } from '@reduxjs/toolkit'
import { Model, ModelDictionary, QueryMeta } from '@danielbingham/peerreview-model'

/**
 * Base Slice State definition, extended by all Entity state slices and many
 * other state slices as well.
 */
export interface BaseSliceState<T extends Model> {
    /**
     * A dictionary of Model entities we've retrieved from the backend, keyed by
     * Model.id.
     */
    dictionary: ModelDictionary<T>

    /**
     * An object containing queries made to query supporting endpoints.
     */
    queries: {
        [name: string]: {
            meta: QueryMeta,
            list: number[]
        }
    }
}

export function setInDictionary<T extends Model, TState extends BaseSliceState<T>>(
    state: TState, 
    action: PayloadAction<{ dictionary?: ModelDictionary<T>, entity?: T }>
) {
    if ( action.payload.dictionary ) {
        state.dictionary = { ...state.dictionary, ...action.payload.dictionary }
    } else if( action.payload.entity ) {
        const entity = action.payload.entity
        state.dictionary[entity.id] = entity 
    } else {
        console.log(action)
        throw new Error(`Invalid payload sent to ${action.type}.`)
    }
}

export function removeEntity<T extends Model, TState extends BaseSliceState<T>>(
    state: TState, 
    action: PayloadAction<{ entity: T }>
) {
    const entity = action.payload.entity
    delete state.dictionary[entity.id]
}

export function makeQuery<T extends Model, TState extends BaseSliceState<T>>(
    state: TState, 
    action: PayloadAction<{ name: string }>
) {
    const name = action.payload.name

    state.queries[name] = {
        meta: {
            page: 1,
            count: 0,
            pageSize: 1,
            numberOfPages: 1
        },
        list: [] 
    }
}

export function setQueryResults<T extends Model, TState extends BaseSliceState<T>>(
    state: TState, 
    action: PayloadAction<{ name: string, meta: QueryMeta, list: number[] }>
) {
    const name = action.payload.name
    const meta = action.payload.meta
    const list = action.payload.list

    if ( ! state.queries[name] ) {
        state.queries[name] = {
            meta: meta,
            list: list
        }
    } else {
        state.queries[name].meta = meta
        state.queries[name].list = list 
    }
}

export function clearQuery<T extends Model, TState extends BaseSliceState<T>>(
    state: TState, 
    action: PayloadAction<{ name: string }>
) {
    const name = action.payload.name

    if ( state.queries[name] ) {
        delete state.queries[name]
    }
}

export function clearQueries<T extends Model, TState extends BaseSliceState<T>>(
    state: TState 
) {
    state.queries = {}
}
