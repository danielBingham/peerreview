output "elasticache_nodes" {
  value = aws_elasticache_cluster.this.cache_nodes
}

output "elasticache_security_group_id" {
  value = aws_security_group.this.id
}
