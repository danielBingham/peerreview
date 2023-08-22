import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { clearList, getJournals, cleanupRequest } from '/state/journals'

const SubmitDraftForPublicationForm = function(props) {

    return (
        <div className="submit-draft-for-publication">
            Submit Draft
        </div>
    )

}

export default SubmitDraftForPublicationForm
