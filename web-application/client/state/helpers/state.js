/******************************************************************************
 * Universal methods for managing state.  These can be imported into a state
 * definition set as reducers on a redux slice.  They then provide the basic
 * state manipulation methods.
 ******************************************************************************/

export const setInDictionary = function(state, action) {
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

export const removeEntity = function(state, action) {
    const entity = action.payload.entity
    delete state.dictionary[entity.id]
}

export const makeQuery = function(state, action) {
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

export const setQueryResults = function(state, action) {
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

export const clearQuery = function(state, action) {
    const name = action.payload.name

    if ( state.queries[name] ) {
        delete state.queries[name]
    }
}

export const clearQueries = function(state, action) {
    state.queries = {}
}
