output "cluster_id" {
  value = aws_eks_cluster.this.id
}

output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "cluster_security_group_id" {
  value = aws_security_group.cluster.id
}

output "load_balancer_controller_role_arn" {
  value = aws_iam_role.load_balancer_controller_role.arn
}

output "cluster_autoscaler_role_arn" {
  value = aws_iam_role.cluster_autoscaler_role.arn
}

output "webapp_nodes_security_group_id" {
  value = module.node_group.nodes_security_group_id
}

output "webapp_node_group_resources" {
  value = module.node_group.eks_node_group_resources
}
