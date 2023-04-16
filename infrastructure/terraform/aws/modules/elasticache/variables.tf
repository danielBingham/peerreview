
/**
 * Networking resource Ids.
 *
 * These are required to configure the database's connection to the network.
 */
variable "vpc_id" {
  description = "The id of the VPC the database will be launched into.  Must be VPC the subnet_ids belong to."
}

variable "subnet_ids" {
  description = "The ids of the subnets you want the redis instance to be associated with."
  type = list(string)
}

/**
 * Naming variables.  
 *
 * These are used to describe what application, environment,
 * and service this piece of infrastructure is supporting.  They are also used
 * to generate appropriate names and tags for resources.
 */
variable "application" {
  description = "The name of the application this module is supporting. eg. peer-review"
}
variable "environment" {
  description = "The name of the environment this module is supporting. eg. production, staging, etc"
}
variable "service" {
  description = "The name of the service this module is supporting. eg. networking, database, storage, etc" 
}

