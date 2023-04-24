/******************************************************************************
 * Staging Database Component
 *
 * This is a component module that only defines the database.  It does
 * not create any of the other infrastructure and depends on a number of other
 * components to have been created first. 
 *
 * Dependencies:
 * - network 
 *
 * See the README.md for more information.
 *
 ******************************************************************************/

module "rds" {
  source = "../../../../modules/rds"

  username = var.username
  password = var.password

  # These come from the output of components/network.
  vpc_id = var.vpc_id 
  subnet_ids = var.subnet_ids 

  instance_class = "db.t4g.medium"

  application = "peer-review" 
  environment = "staging" 
  service = "database" 
}
