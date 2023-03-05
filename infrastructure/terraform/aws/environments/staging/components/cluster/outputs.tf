output "cluster_id" {
  value = module.eks.cluster_id 
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint 
}

output "cluster_security_group_id" {
  value = module.eks.cluster_security_group_id 
}

output "load_balancer_controller_role_arn" {
  value = module.eks.load_balancer_controller_role_arn 
}

output "cluster_autoscaler_role_arn" {
  value = module.eks.cluster_autoscaler_role_arn 
}

output "webapp_nodes_security_group_id" {
   value = module.eks.webapp_nodes_security_group_id
}

output "webapp_node_group_resources" {
  value = module.eks.webapp_node_group_resources
}

