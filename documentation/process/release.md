# Peer Review - Release Process

When you believe the current main branch is ready for a major release, this is
the process to follow.

## Major or Minor Release

This is the release process for releasing major `N.0.0` or minor `x.N.0`
versions.

1. Determine the type of release -- major, minor, or patch -- and the next
   release version of the format `x.x.x`.
1. Update the Kubernetes manifests in `infrastructure/kubernetes/staging` and
   `infrastructure/kubernetes/production` to point to the new version `x.x.x`.
   This involves updating the `image: ` field of the `Deployment` in the
   manifest.
1. Commit the changes to the Kubernetes manifests with the commit message
   `Updating deployments for version x.x.x` and push the change to `origin`.
1. Copy the `TEMPLATE` section to create a section in the `release.md` file for
   the release with the header `## Release x.x.x`
   1. Populate the changelog of the section with one line for each story
       explaining what the story was. eg. `Issue #xxx - fixed a foo that
       happened when bar`
1. Commit the change to releases with the message `Creating initial changelog for release x.x.x`
1. Create a branch `release/x.x.x`, check out the branch locally.  We will just
   use this branch to track testing.
    1. Update the `Local Regression: ` field in the release section to `pending`.
    1. Commit the change and push the branch to `origin`.
    1. Open a PR for your release branch and copy and paste the `Full
       Regression` section of the [testing](../testing) document into the PR
       header twice -- once headlined "Local Regression" and once headlined
       "Staging Regression".
1. Run through the full regression on local and fix any bugs discovered.
   Commit the fixed bugs to main, not the release branch. (The release branch
   is just for tracking release testing.)
    1. Update the `Local Regression: ` field with the date and commit it to
       your branch.
1. Run the "Release" action on Github with the version parameter set to
   `x.x.x`.  This will tag the repo and generate the appropriate docker
   containers.
1. Use `kubectl config get-contexts` to confirm you are currently on the
   staging cluster.
    1. Use `kubectl apply -f infrastructure/kubernetes/staging/<file>` to apply
       the `peer-review` manifest and the `peer-review-workers` manifest on
       staging.  This will release version `x.x.x` to the staging environment.
1. Run through the full regression on staging
    1. IF NEW BUGS ARE DISCOVERED:  Determine whether the bugs invalidate the
       release and require a hotfix.  If they do, create a patch milestone, fix
       the bugs, and then run through the Patch Release process.  Otherwise,
       carry on with this release process.
       1. IF NEW BUGS ARE NOT DISCOVERED: Update the "Staging Regression: "
       section of the `releases.md` document with the date the staging
       regression was completed on and push the change to the `release/x.x.x`
       branch.
1. Use `kubectl config use-context arn:xxxxx` to switch to `production`.
    1. Use `kubectl apply -f infrastructure/kubernetes/production/<file>` to
       apply the `peer-review` and `peer-review-worker` manifests on
       production.  This releases the changes to production.
1. Update the "Release Date: " section of the release template, commit and push it.
1. Merge the `release/x.x.x` pull request.
1. The release is now complete.

## Patch Release

TODO


