import React, { useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'

// import { initializeReputation, cleanupRequest} from '/state/reputation'
import { getJob, postJobs, cleanupRequest } from '/state/jobs'

import ProgressBar from '/components/ProgressBar'
import Spinner from '/components/Spinner'

import './ReputationInitializationPage.css'

const ReputationInitializationPage = function(props) {
    const [ jobId, setJobId ] = useState(null)
    const [ step, setStep ] = useState('initializing')
    const [ stepDescription, setStepDescription ] = useState('Initializing...')
    const [ progress, setProgress ] = useState(0)
    const [ error, setError ] = useState(null)

    const [postJobsRequestId,  setPostJobsRequestId] = useState(null)
    const postJobsRequest = useSelector(function(state) {
        if ( postJobsRequestId) {
            return state.jobs.requests[postJobsRequestId]
        } else {
            return null
        }
    })

    const [ getJobRequestId, setGetJobRequestId ] = useState(null)
    const getJobRequest = useSelector(function(state) {
        if ( getJobRequestId ) {
            return state.jobs.requests[getJobRequestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser 
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    const timeout = useRef(null)

    // Create the job.  If there's already an 'initialize-reputation' job
    // running for this user, then this call will return that job id and we can
    // begin polling it.
    useEffect(function() {
        setPostJobsRequestId(dispatch(postJobs('initialize-reputation', { userId: currentUser.id })))         
    }, [])

    useEffect(function() {
        if ( ! getJobRequestId && postJobsRequest?.state == 'fulfilled' ) {
            // Easier to check the job id than this request result.   It's the
            // only thing we need from the result.
            const id = postJobsRequest.result.id
            setJobId(id)

            // Trigger the first poll.  We'll continue polling  in the next
            // useEffect.
            setGetJobRequestId(dispatch(getJob(id)))
        }
    }, [ postJobsRequest ])

    // Poll for the job's state.  Poll every 250 ms and update our display of
    // the job's progress.
    useEffect(function() {
        if ( getJobRequest?.state == 'fulfilled' ) {
            if ( getJobRequest.result?.progress.step == 'complete' && ! getJobRequest.result?.returnvalue?.error ) {
                setStep(getJobRequest.result?.progress.step || 'initializing')
                setStepDescription(getJobRequest.result?.progress.stepDescription || 'Initializing and waiting for a worker...')
                setProgress(getJobRequest.result?.progress.progress || 0)
            } else if ( ! getJobRequest.result?.returnvalue?.error ) {
                setStep(getJobRequest.result?.progress.step || 'initializing')
                setStepDescription(getJobRequest.result?.progress.stepDescription || 'Initializing and waiting for a worker...')
                setProgress(getJobRequest.result?.progress.progress || 0)

                // jobRequestId isn't going to be set by the timeout for 250
                // ms.  If we don't set it to null here it prevents us from
                // determining whether we've already triggered the next poll.
                // useEffect will fire more frequently than the polling
                // timeout, so we'll repeatedly set the timeout, before the
                // polling even gets a chance to fire.  In doing so, we'll
                // repeatedly set getJobRequestId and thus getJobRequest and
                // will never get to see any of the jobs return. 
                //
                // Setting getJobRequestId to null before we set the timeout
                // fixes the problem, because it prevents this useEffect from
                // firing and setting another timeout until the current timeout
                // (the one we create on the next line) completes.
                setGetJobRequestId(null)
                timeout.current = setTimeout(function() {

                    setGetJobRequestId(dispatch(getJob(jobId)))
                }, 250)

            } else if ( getJobRequest.result?.returnvalue?.error ) {
                setError(getJobRequest.result.returnvalue.error)
            }
        }

    }, [getJobRequest])

    // If we leave this component with a timeout waiting, kill that timeout.
    // No point in letting it finish.
    useEffect(function() {
        return function cleanupHangingTimeout() {
            if ( timeout.current ) {
                clearTimeout(timeout.current)
            }
        }
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( postJobsRequestId ) {
                dispatch(cleanupRequest({ requestId: postJobsRequestId}))
            }
        }
    }, [ postJobsRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( getJobRequestId ) {
                dispatch(cleanupRequest({ requestId: getJobRequestId}))
            }
        }
    }, [ getJobRequestId ])

    // ======= Render ===============================================

    let message = null
    if ( step == 'complete' && progress == 100 ) {
        message = (
            <div>
                <p>We've finished generating initial reputation for you.</p> 
                <Link to={`/user/${currentUser.id}/reputation`}>View profile</Link>
            </div>
        )
    } else {
        message = (
            <div>
                We're now attempting to initialize your reputation using your ORCID
                iD record and OpenAlex.  This could take a while, especially if
                you have a lot of published works. 
            </div>
        )
    }


    // Show the progress bar and step.
    let content = (
        <div className="initializing-reputation">
            <div className="text-wrapper">
                { message }
            </div>
            <div className="progress-bar-wrapper">
                <div className="step-description">{ stepDescription }</div>
                <ProgressBar progress={ progress } />
            </div>
        </div>
    )

    // ========== Reputation Request Failed =======================
    if ( error ) {

        // They aren't logged in, or someone hit the API endpoint with out including the user id.
        // The former error shouldn't ever bit hit from this page, but we'll handle it anyway.
        if ( error == 'userid-is-required' || error == 'not-authenticated' ) {
            content = (
                <div className="error">
                   You don't seem to be logged in.  You cannot initialize your reputation with out being logged in. 
                </div>
            )
        } 
        // They somehow called the endpoint with a different user than they
        // have authenticated as.  This is an error we should never hit
        // from this page, but we'll handle it anyway.
        else if ( error == 'not-authorized:wrong-user' ) {
            content = (
                <div className="error">
                    You appear to be attempting to initialize someone else's reputation.  That's not allowed.
                </div>
            )
        } 
        // There was no ORCID iD on their record.  This can happen if they
        // navigate to this page with out going through the ORCID
        // authentication flow.  
        else if ( error == 'no-orcid' ) {
            content = (
                <div className="error">
                    <h2>No ORCID iD</h2>
                    <p> 
                        We couldn't find an <a href="https://orcid.org">ORCID iD</a> on your user record.  You
                        must have an ORCID iD linked to your account in order
                        to initialize your reputation. 
                    </p>
                    <p>
                        If you would like to initialize your reputation, please <Link to="/account/orcid">connect your ORCID iD</Link> to your account.
                    </p>
                    <p>Return to the <Link to="/">home page</Link>.</p>
                </div>
            )
        } 
        // One of our requests to OpenAlex failed for some reason.  Logs should
        // give more details.
        else if ( error == 'server-error:api-connection' ) {
            content = (
                <div className="error">
                    <h2>API Connection Error</h2>
                    <p> Something went wrong with our attempt to connect to <a href="https://openalex.org">OpenAlex</a> on the backend.</p>
                    <p>Please wait a little while and try again.  You can try again by just refreshing this page.</p>
                    <p>
                        If this error persists, please report a bug by
                        contacting <a
                        href="mailto:contact@peer-review.io">contact@peer-review.io</a>,
                        or by visting our <a
                        href="https://github.com/danielbingham/peerreview">Github</a> and creating an Issue.
                    </p>
                    <p>Return to the <Link to="/">Home page</Link>.</p>
                </div>
            )
        }

        // We weren't able to find an OpenAlex Author record attached to that
        // ORCID iD.
        else if ( error == 'no-openalex-record' ) {
            content = (
                <div className="error">
                    <h2>No OpenAlex Author Record</h2>
                    <p>
                        We were unable to find an <a href="https://openalex.org">OpenAlex</a> author record for
                        your <a href={`https://orcid.org/${currentUser.orcidId}`}>ORCID iD</a>.  This could happen for any number of
                        reasons.  OpenAlex has a very large dataset, but they
                        don't have access to everything.  Right now, OpenAlex
                        and ORCID iD are our only way to initialize reputation.
                    </p>
                    <p>
                        OpenAlex is a small team and they're working very hard
                        to improve their data set.  If you'd like to see our
                    reputation generation improve, support them in their work!
                    </p>
                    <p className="return-home">
                        Return to the <Link to="/">home page</Link>.
                    </p>
                </div>
            )
        }

        else if ( error == 'multiple-openalex-record' ) {
            content = (
                <div className="error">
                    <h2>Multiple Author Records</h2>
                    <p>
                        We found multiple <a
                        href="https://openalex.org">OpenAlex</a> author records
                    attached to your ORCID iD.  Without knowing which one is
                        the correct record (if any) we can't generate
                        reputation for you.</p>
                    <p>OpenAlex is working on cleaning up their data. You can
                        return to this page to try again once your ORCID iD has
                        been disambiguated in OpenAlex. 
                    </p>
                    <p className="return-home">
                        Return to the <Link to="/">home page</Link>.
                    </p>
                </div>
            )
        }

        else {
            content = (
                <div className="error">
                    { error }
                </div>
            )
        }
    }

    // ========== Reputation Request Succeeded ====================
    /*if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
                We have successfully initialized your reputation!<br />
                You'll be redirected to the homepage shortly.
            </div>
        )
    }*/

    // Render the component
    return (
        <div id="reputation-initialization" className="page">
            { content }
        </div>
    )
}

export default ReputationInitializationPage
