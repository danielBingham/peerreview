import React from 'react'
import { createRoot } from 'react-dom/client'

import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

import App from './App'
import store from './state/store'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
    <Provider store={store}>
        <App />
    </Provider>
)
