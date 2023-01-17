/**
 * We need this output for more or less every other module.  It's used by
 * security groups which will be defined in the modules they're used in.
 */
output "vpc_id" {
  value = aws_vpc.this.id
}

/**
 * We'll need these ids in order to launch resources into public subnets in
 * other modules.
 */
output "public_subnet_ids" {
  value = module.availability_zone[*].public_subnet_id
}

/**
 * We'll need these ids in order to launch resources into private subnets in
 * other modules.
 */ 
output "private_subnet_ids" {
  value = module.availability_zone[*].private_subnet_id
}
