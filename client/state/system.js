import { createSlice } from '@reduxjs/toolkit'


const systemSlice = createSlice({
    name: 'system',
    initialState: {},
    reducers: {
        reset: function(state, action) {}
    }
})

export const { reset } = systemSlice.actions
export default systemSlice.reducer
