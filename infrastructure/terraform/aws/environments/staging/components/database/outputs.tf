/**
 * We'll use this to allow other resources to define their access to the
 * database.
 */
output "database_security_group_id" {
  value = module.rds.database_security_group_id
}

/**
 * Necessary to add monitoring to the database.
 */
output "database_id" {
  value = module.rds.database_id
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_host" {
  value = module.rds.database_host 
}

/**
 * Used to allow the application to connect to the database.
 */
output "database_port" {
  value = module.rds.database_port 
}
