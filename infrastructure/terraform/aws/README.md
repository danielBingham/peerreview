# Peer Review AWS Infrastructure

The AWS infrastructure for Peer Review is defined in Terraform.  It is
organized in several layers.  The base layers is modules around AWS managed
services that define the service component, grouping together the resources
necessary for each component.

These modules can then be apply individually on a component by component basis,
taking the outputs from each component and using them as variable inputs for
their dependents, or group together into whole environment modules that can be
launched in a single apply.

The module definitions can be found in `/modules`.  Environment definitions,
with modules both for the whole environment and for each of the environment's
individual components can be found under `/environments`.  Any infrastructure
that spans multiple environments will be defined at this level, and example
being the root Route53 Hosted Zone definition which can be found under
`/hosted-zone`.

Futher documentation for each environment, component, and module can be found
in READMEs located alongside the source code.
