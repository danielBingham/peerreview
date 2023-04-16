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
 * Necessary to add monitoring to the database.
 */
output "database_id" {
  value = module.database.database_id
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_host" {
  value = module.database.database_host 
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_port" {
  value = module.database.database_port 
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

