/******************************************************************************
 * Bastion for the Staging Environment
 *
 * Dependencies:
 *  - Core
 ******************************************************************************/

module "bastion_component" {
  source = "../../components/bastion"

  vpc_id = var.vpc_id
  subnet_ids = var.public_subnet_ids
  public_key_path = var.public_key_path
}
