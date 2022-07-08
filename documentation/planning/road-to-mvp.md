# The Road to Releasable MVP

**Alpha**: Happy path working for simplified version of the basic feature set.
Very simple deployable infrastructure.

**Beta**: Happy path covered for the full basic feature set. Most errors and
edge cases covered. First pass at deployable scalable production
infrastructure.

**MVP: 1.0.0**: Errors and edge cases covered for the full basic feature set. Public
facing documentation done and ready.  Deployable infrastructure hardened.

## MVP Feature Set

**Authentication**: The ability to create an account and login.  Support for
username and password authentication and Google authentication.

**Peer Review**: The ability to post the draft of a paper and request peer
review.  The ability to post a review on a draft of a paper.  The ability to
accept or reject a review posted on your paper.  The ability to publish a paper
and have it go live.  The ability to post a response to a paper once it has
gone live. Reviews and Responses can be written in latex or markdown.

**Field Tagging**: The ability to tag papers with up to 5 fields it's relevant to.

**Reputation**: The accepted reviews grant reputation.  Creating an account
with an institutional email grants a start reputation based on impact score.
The ability to vote a paper up or down, up votes grant the author(s)
reputation, down votes take it away.  Reputation score is shown next to
Author's display name.  Reputation is gained in the fields posted on the paper.

## Post-MVP Features

**Moderation tools**: Gaining a certain reputation in a certain field grants
moderation privileges in that field?

**Tag Editing**: Gaining a certain overall reputation grants the ability to
edit and organize fields?

## MVP Epic Plans

**Authentication**: [Authentication Plan](./authentication.md)

## What's Left for MVP Brainstorm

### Alpha 

These are things we need to do before alpha release.  An alpha we'll deploy to
an infrastructure and invite a very limited set of early testers in to give
feedback.

[issue #26](https://github.com/danielBingham/peerreview/issues/26) **User Profile Editing** Edit basic profile data (name, bio, institution).

[issue #27](https://github.com/danielBingham/peerreview/issues/27) **User Page Slug** Show a slug for user's profile pages after their ID number,
and let them edit it.

[issue #28](https://github.com/danielBingham/peerreview/issues/28) **User Account Update** Update email, change password.

[issue #29](https://github.com/danielBingham/peerreview/issues/29) **User Settings Page** Choose tags to ignore, highlight, or isolate.

[issue #30](https://github.com/danielBingham/peerreview/issues/30) **Session Settings** The ability to dismiss our front page notices and have the
dismissal recorded for the duration of the session.

[issue #31](https://github.com/danielBingham/peerreview/issues/31) **Post a new Version of a Paper in Review** The ability to post new versions of
papers in review, and get new rounds of review on them. The ability to view
previous versions.

[issue #32](https://github.com/danielBingham/peerreview/issues/32) **Accept or Reject a Review** The ability to accept or reject a review.
Accepted reviews grant reputation.

[issue #34](https://github.com/danielBingham/peerreview/issues/34) **Initial Reputation from Citations** Find a citation count somewhere and
initial reputation from the citation count.

[issue #35](https://github.com/danielBingham/issues/35) **Add Authors who Aren't Users** The ability to add authors to a paper with out
them being users.  None user authors have their email requested and an "Invite
them?" checkbox.

[issue #36](https://github.com/danielbingham/issues/36) **Field Hierarchy Breadcrumbs** Show bread crumbs on the field view page going
back up the hierarchy.

[issue #33](https://github.com/danielbingham/issues/33) **Published Paper Responses** The ability to post a response to a public paper.

[issue #37](https://github.com/danielbingham/issues/37) **Published Paper PDF Viewer** We only want to see one page at a time for
PUblished papers, so that you don't have to scroll forever to see the
responses.  We need a viewer.

[issue #38](https://github.com/danielbingham/issues/38) **Refactor paper uploads to use FileController**  We want to have a single
unified interface for all file uploads, with a single database table for
storing file paths that can be references by their usage.  It'll save us code
duplication.

**Paper Search** The ability to search paper's title and contents. To do this,
we'll need to be able to pull the paper's contents and store it on the backend
in the database so we can run a full text search against it.

**Deployment Infrastructure**  We need to deploy a version of the site to a
staging site so that we can start sharing it with folks.

**S3/equivalent file storage for papers**

**Peer Review Blog**  We want to create a simple Jekyl blog and host it on an
S3 equivalent.  The plan is to write up a series of articles explaining the
problems with academic publishing and how Peer Review could potentially fix
them.

### Beta

These are the things we want to get done before a beta release.  A beta release
we'll announce publicly and allow an open beta.

**Reputation Based Permissions** You can only review if you have 10,000
reputation in the fields (total?  or in each field?  or in only one of the
fields?).  You can only vote and post responses if you 10,000 reputation in the
fields.  Those numbers are tentative.

**Paper List Sorting**  The ability to sort the paper list.

**Paper List Pagination** Pagination for the paper list.

**Field List sorting** The ability to sort the field list?

**Field list pagination** Pagination for the field list?

**User list sorting** The ability to sort the user list.

**User list pagination** The ability to paginate the user list.

**Blind reviews** We want to be able to offer double blind reviews, where
neither the reviewer nor the authors know who the others are.  This is a little
tricky, because it means we can't expose any identifying user information on
the client side.  The plan is to use a blind_id that we only ever tie back to
the user on the server side.

**Relative dates** Right now we just show timestamps.  We want to show relative
dates everywhere.

**WYSIWYG Everything** Review comments, review summary, and paper responses all
need a Markdown capable WYSIWYG editor.

**PDF Text overlay** Bonus?  We need to overlay text on top of the PDF so that
users can copy and paste out of the PDF.

**Downloading PDF of papers** Users want to download PDFs of Papers.

**User Profile Pictures** Users can upload pictures to their profiles.

**Use routing for Reviews** Right now we're using redux state to track
navigation among reviews and review comments on the draft paper review page.
We should be using routing.  That way you can link to a particular review or
comment.

**Full Authentication and Authorization**  We need to do all the things in the
Authentication epic to build a really solid authentication system.

**Responsive Design**  We want to give it a responsive design, at least
partially.  We'll probably only do desktop/laptop at first for the beta.

**Styling pass**  The styling and UX right now is servicable.  We'll need help
from someone with a better design eye to give it a good polishing.

**Unit test all the things**

**Document all the things**

**Integration test all the things**

**Production deployment infrastructure**

### Bonus (Or 1.0.0+)

**Latex in Text Fields** Add latex support for math to all Markdown capable fields.

**Mermaid support?** Add mermaid support to all Markdown capable fields?

**Github flavored Markdown** Add github flavored Markdown support to all Markdown capable fields.

**Sorting Reviews?** The ability to sort reviews on the draft paper page by date, recommendation, ...other?

**Support for Uploading Papers as Latex** We want to support uploading papers
as latex and then rendering them client side to HTML rather than PDF, with the
ability to comment directly on the latex code.

**Support for Uploading Papers as Docx** We want to support uploading papers as
docx, because that's another common format people use.  We should be able to
use pandoc to convert them to HTML clientside for a better review experience.

**DOIs for all Uploaded Papers** We should attach DOIs to all papers uploaded
to Peer Review.  It's the system currently in wide adoption in academia (though
we could easily replace it with something better, in this case it's probably
better to just go with it.)
