output "cluster_primary_instance_id" {
  value = aws_rds_cluster_instance.primary.id
}

/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "cluster_security_group_id" {
  value = aws_security_group.this.id
}

/**
 * Necessary to add monitoring to the database.
 */
output "cluster_id" {
  value = aws_rds_cluster.this.id 
}

/**
 * Used to allow the application to connect to the database.
 */
output "endpoint" {
  value = aws_rds_cluster.this.endpoint 
}

/**
 * Used for read only connections to the database.
 */
output "reader_endpoint" {
  value = aws_rds_cluster.this.reader_endpoint
}

/**
 * Used to allow the application to connect to the database.
 */
output "cluster_port" {
  value = aws_rds_cluster.this.port 
}

/**
 * Get information about the members of the cluster.
 */
output "cluster_instances" {
  value = aws_rds_cluster.this.cluster_members
}

