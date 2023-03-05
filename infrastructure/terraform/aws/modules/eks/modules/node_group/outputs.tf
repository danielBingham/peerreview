output "nodes_security_group_id" {
  value = aws_security_group.nodes.id
}

output "eks_node_group_resources" {
  value = aws_eks_node_group.this.resources
}
