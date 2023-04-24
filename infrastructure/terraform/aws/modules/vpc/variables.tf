variable "availability_zones" {
  description = "A list of availability zones that we want to create subnets for.  Must match the region defined in the current provider."
  type = list(any)
  default = [ "us-east-1a", "us-east-1b", "us-east-1c" ]
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
