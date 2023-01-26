/******************************************************************************
 * Staging Environment
 *
 * This module defines a (mostly) complete staging environment for Peer Review.
 * Components not managed by the environment include:
 * - Storage
 * - DNS
 *
 * Before launching this environment, please read the README.md file and ensure
 * that allow components that this module will create have not been created as
 * individual components in the `/components` directory.  Go through each
 * component in the directory and run `terraform destroy` to ensure that the
 * component has been destroyed.
 *
 ******************************************************************************/

module "vpc" {
  source = "../../../../modules/vpc"

  availability_zones = [ "us-east-1a", "us-east-1c" ]

  application = "peer-review" 
  environment = "staging" 
  service = "network" 
}

module "database" {
  source = "../../../../modules/rds"

  username = var.username
  password = var.password

  # These come from the output of components/network.
  vpc_id = module.vpc.vpc_id 
  subnet_ids = module.vpc.private_subnet_ids 

  instance_class = "db.t4g.small"
  allocated_storage = 20

  application = "peer-review" 
  environment = "staging" 
  service = "database" 
}

module "cluster" {
  source = "../../../../modules/eks"

  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  application = "peer-review" 
  environment = "staging" 
  service = "cluster"
}

