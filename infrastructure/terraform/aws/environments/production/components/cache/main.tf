/********************************************************************
 * Production Cache Component
 *
 * This is a component module that only defines the Redis cache.  It does not
 * create any of the other infrastructure and depends on a number of other
 * components to have been created first. 
 *
 * Dependencies:
 * - network
 *
 * See the README.md for more information.
 *
 * ******************************************************************/

module "elasticache" {
  source = "../../../../modules/elasticache"

  # These come from the output of components/network.
  vpc_id = var.vpc_id 
  subnet_ids = var.subnet_ids 

  application = "peer-review" 
  environment = "production" 
  service = "cache" 
}
