/**
 * Needed to allow other modules to launch resources into the public subnet of
 * this availability zone. 
 */
output "public_subnet_id" {
  value = aws_subnet.public.id
}

/**
 * Needed to allow other modules to launch resources into the private subnet of
 * this availability zone.
 */
output "private_subnet_id" {
  value = aws_subnet.private.id
}
