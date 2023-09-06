import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon, QuestionMarkCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

import { TabbedBox, TabbedBoxTab, TabbedBoxContent } from '/components/generic/tabbed-box/TabbedBox'
import { Timeline, TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'

import ReviewDecisionControls from '/components/reviews/widgets/ReviewDecisionControls'
import SubmissionControls from '/components/journals/widgets/SubmissionControls'

const PaperDecisionControl = function({ paperId }) {

    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const submissions = useSelector(function(state) {
        const allSubmissions = Object.values(state.journalSubmissions.dictionary)
        return allSubmissions.filter((s) => s.paperId == paper.id)
    })

    const journalDictionary = useSelector(function(state) {
        const dictionary = {}
        for(const submission of submissions) {
            dictionary[submission.journalId] = state.journals.dictionary[submission.journalId]
        }
        return dictionary
    })

    const editorSubmissions = submissions?.filter((s) => ( currentUser?.memberships.find((m) => (m.permissions == 'owner' || m.permissions == 'editor') && s.journalId == m.journalId) ? true : false )) 

    let decisionViews = []
    let controlViews = []
    if ( paper.isDraft ) {
        if ( editorSubmissions ) {
            for(const submission of editorSubmissions ) {
                if ( ! submission.deciderId ) {
                    const membership = currentUser.memberships.find((m) => m.journalId == submission.journalId)
                    const membershipAction = ( membership.permissions == 'editor' || membership.permissions == 'owner') ? 'Editting' : 'Reviewing' 

                    controlViews.push(
                        <TabbedBox key={submission.id} className="submission-controls-wrapper">
                            <TabbedBoxTab>{ membershipAction } for <Link to={`/journal/${submission.journalId}`}>{ journalDictionary[submission.journalId].name }</Link></TabbedBoxTab>
                            <TabbedBoxContent>
                                <SubmissionControls submissionId={submission.id} />
                                <ReviewDecisionControls submission={submission} />
                            </TabbedBoxContent>
                        </TabbedBox>
                    )
                } else {
                    decisionViews.push(
                        <TimelineItem key={submission.id}>
                            <TimelineIcon>
                                <CheckBadgeIcon />
                            </TimelineIcon>
                            <TimelineItemWrapper>
                                <div className="decision">
                                    <div><UserTag id={submission.deciderId} /> { submission.status == 'published' ? 'published' : 'rejected' } this paper for <JournalTag paper={paper} submission={submission} />.</div>
                                    { submission.decisionComment }
                                </div>
                            </TimelineItemWrapper>
                        </TimelineItem>
                    )
                }

            }
        }
    } else {
        if ( submissions ) {
            for(const submission of submissions) {
                if ( submission.status == 'published' ) {
                    decisionViews.push(
                        <TimelineItem key={submission.id}>
                            <TimelineIcon>
                                <CheckBadgeIcon />
                            </TimelineIcon>
                            <TimelineItemWrapper>
                                <div className="decision">
                                    <div><UserTag id={submission.deciderId} /> published this paper in <JournalTag paper={paper} submission={submission} />.</div>
                                    { submission.decisionComment }
                                </div>
                            </TimelineItemWrapper>
                        </TimelineItem>
                    )
                }
            }
        }
    }

    return null
}

export default PaperDecisionControl
