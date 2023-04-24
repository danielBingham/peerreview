output "cluster_primary_instance_id" {
  value = module.database.cluster_primary_instance_id
}

/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "cluster_security_group_id" {
  value = module.database.cluster_security_group_id
}

/**
 * Necessary to add monitoring to the database.
 */
output "cluster_id" {
  value = module.database.cluster_id
}

/**
 * Used to allow the application to connect to the database.
 */
output "cluster_endpoint" {
  value = module.database.endpoint 
}

/**
 * Used for read only connections to the database.
 */
output "cluster_reader_endpoint" {
  value = module.database.reader_endpoint
}

/**
 * Used to allow the application to connect to the database.
 */
output "cluster_port" {
  value = module.database.cluster_port 
}

/**
 * Get information about the members of the cluster.
 */
output "cluster_instances" {
  value = module.database.cluster_instances 
}

