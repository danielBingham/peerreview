import React from 'react'

import FieldListView from '/components/fields/list/FieldListView'

import './FieldsListPage.css'

const FieldsListPage = function(props) {

    return (
        <div id="fields-list-page" className="page">
            <FieldListView />
        </div>
    )
}

export default FieldsListPage
