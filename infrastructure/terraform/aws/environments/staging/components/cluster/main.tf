/******************************************************************************
 * Staging Cluster Component
 *
 * This is a component module that only defines the Kubernetes Cluster.  It does
 * not create any of the other infrastructure and depends on a number of other
 * components to have been created first.  
 *
 * Direct Dependencies:
 * - network
 * - database
 *
 * See the README.md for more information.
 *
 ******************************************************************************/

module "cluster" {
  source = "../../../../modules/eks"

  subnet_ids = var.subnet_ids

  application = "peer-review" 
  environment = "staging" 
  service = "cluster"
}

