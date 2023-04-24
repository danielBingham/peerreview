/******************************************************************************
 * Outputs for Staging Environment Core
 ******************************************************************************/

// =========== Network Outputs ============================

output "public_subnet_ids" {
  value = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "vpc_id" {
  value = module.network.vpc_id
}

// =========== Database Outputs ===========================

/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "database_cluster_security_group_id" {
  value = module.database.cluster_security_group_id
}

/**
 * Necessary to add monitoring to the database.
 */
output "database_cluster_id" {
  value = module.database.cluster_id
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_cluster_endpoint" {
  value = module.database.cluster_endpoint 
}

/**
 * Used for read only connections to the database.
 */
output "database_cluster_reader_endpoint" {
  value = module.database.cluster_reader_endpoint
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_cluster_port" {
  value = module.database.cluster_port 
}

/**
 * Get information about the members of the cluster.
 */
output "database_cluster_instances" {
  value = module.database.cluster_instances 
}


// =========== Cache Outputs ==============================

output "cache_nodes" {
  value = module.cache.cache_nodes
}

// =========== Cluster Outputs ============================

output "cluster_id" {
  value = module.cluster.cluster_id 
}

output "cluster_endpoint" {
  value = module.cluster.cluster_endpoint 
}

output "load_balancer_controller_role_arn" {
  value = module.cluster.load_balancer_controller_role_arn 
}

output "cluster_autoscaler_role_arn" {
  value = module.cluster.cluster_autoscaler_role_arn 
}

output "webapp_node_group_resources" {
  value = module.cluster.webapp_node_group_resources
}

