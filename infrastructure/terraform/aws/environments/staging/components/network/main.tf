/******************************************************************************
 * Staging Network Component
 *
 * This is a component module that only defines the network.  It does
 * not create any of the other infrastructure and depends on a number of other
 * components to have been created first. 
 *
 * Dependencies:
 *  None.  This is a root component.
 *
 * See the README.md for more information.
 *
 ******************************************************************************/

module "vpc" {
  source = "../../../../modules/vpc"

  availability_zones = [ "us-east-1a", "us-east-1c" ]

  application = "peer-review" 
  environment = "staging" 
  service = "network" 
}
