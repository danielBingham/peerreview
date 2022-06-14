import React from 'react'

import DraftPapersAwaitingReviewListView from '/components/reviews/DraftPapersAwaitingReviewListView'

const ReviewPapersListPage = function(props) {

    return (
        <section id="review-papers-list-page">
            <DraftPapersAwaitingReviewListView />
        </section>
    )
}

export default ReviewPapersListPage
