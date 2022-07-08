import React from 'react'

import FieldListView from '/components/fields/list/FieldListView'

import './FieldsListPage.css'

const FieldsListPage = function(props) {

    return (
        <div id="fields-list-page" className="page">
            <div className="explanation">
                <p>
                    These are the top-level academic fields on the site.  Each
                    field can have children, which can have children, and so on,
                    forming the full heirarchy of academic disciplines.  
                </p>
                <p>
                    Defining a
                    new top-level field takes the support of a significant
                    percentage of the community.  Defining a new child field takes
                    the support of peers with a certain reputation in its parent.  
                </p>

                <p>
                    To view the children of a particular field, as well as the
                    papers published in that field and its children, click into
                    it.
                </p>
            </div>
            <FieldListView />
        </div>
    )
}

export default FieldsListPage
