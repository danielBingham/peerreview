
/**
 * An error handling helper for our thunk action creators.  They all use the
 * same approach to error handling.  This is intended to be used in the context
 * of a redux slice and needs to get dispatch from the returned thunk, and the
 * `failRequest` method from your actions object.  For example:
 * `usersSlice.actions.failRequest`.
 *
 * dispatch: the redux dispatch method
 * failRequest: the failRequest action from your slice's `actions` object
 * requestId: uuid identifying the request that generated the error.
 * error: `Error` object OR an object with `status` and `error`
 * defined OR simply a string.
 */
export default function handleError(dispatch, failRequest, requestId, error) {
    if (error instanceof Error) {
        console.log(error)
        dispatch(failRequest({requestId: requestId, error: error.toString()}))
    } else if( error.status ) {
        dispatch(failRequest({requestId: requestId, status: error.status, error: ''}))
    } else {
        console.log(error)
        dispatch(failRequest({requestId: requestId, error: 'unknown'}))
    }

}
