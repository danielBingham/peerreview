output "load_balancer_controller_role_arn" {
  value = module.cluster.load_balancer_controller_role_arn
}
output "cluster_autoscaler_role_arn" {
  value = module.cluster.cluster_autoscaler_role_arn
}
output "cluster_id" {
  value = module.cluster.cluster_id
}
