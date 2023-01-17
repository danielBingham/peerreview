/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "database_security_group_id" {
  value = aws_security_group.this.id
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_host" {
  value = aws_db_instance.this.address
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_port" {
  value = aws_db_instance.this.port
}
