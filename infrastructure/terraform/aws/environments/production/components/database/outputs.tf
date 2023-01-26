/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "database_security_group_id" {
  value = module.database.database_security_group_id
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
