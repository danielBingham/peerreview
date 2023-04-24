output "cluster_id" {
  value = module.cluster.cluster_id 
}

output "cluster_endpoint" {
  value = module.cluster.cluster_endpoint 
}

output "cluster_security_group_id" {
  value = module.cluster.cluster_security_group_id 
}

output "load_balancer_controller_role_arn" {
  value = module.cluster.load_balancer_controller_role_arn 
}

output "cluster_autoscaler_role_arn" {
  value = module.cluster.cluster_autoscaler_role_arn 
}

output "webapp_nodes_security_group_id" {
   value = module.cluster.webapp_nodes_security_group_id
}

output "webapp_node_group_resources" {
  value = module.cluster.webapp_node_group_resources
}

