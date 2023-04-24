/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "cluster_security_group_id" {
  value = module.rds.cluster_security_group_id
}

/**
 * Necessary to add monitoring to the database.
 */
output "cluster_id" {
  value = module.rds.cluster_id
}

/**
 * Used to allow the application to connect to the database.
 */
output "cluster_endpoint" {
  value = module.rds.endpoint 
}

/**
 * Used for read only connections to the database.
 */
output "cluster_reader_endpoint" {
  value = module.rds.reader_endpoint
}

/**
 * Used to allow the application to connect to the database.
 */
output "cluster_port" {
  value = module.rds.cluster_port 
}

/**
 * Get information about the members of the cluster.
 */
output "cluster_instances" {
  value = module.rds.cluster_instances 
}

