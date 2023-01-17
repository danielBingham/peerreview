
module "bastion" {
  count = length(var.subnet_ids)
  
  source = "../../../../modules/bastion"

  vpc_id = var.vpc_id
  subnet_id = var.subnet_ids[count.index]
  public_key_path = var.public_key_path

  application = "peer-review" 
  environment = "staging" 
  service = "network" 
}

