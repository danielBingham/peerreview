
/**
 * VPC resource IDs.
 *
 * These are the ids of resources created at the VPC level that subnet level
 * resources need to reference.
 */
variable "vpc_id" {
  description = "The id of the VPC to place this subnet in."
}
variable "gateway_id" {
  description = "The id of the internet gateway this subnet will use to talk to the internet."
}


/**
 * Subnet Definition Variables
 *
 * These are variables that define the structure of the subnets being launched
 * into this availability zone.  Including which availability zone we're
 * creating subnets for.
 */
variable "availability_zone" {
  description = "The availability zone we want to create subnets for."
}
variable "subnet_base" {
  description = "The base CIDR block that the two subnets will use.  For example: In a VPC with 10.0.0.0 and `subnet_base` of 1, then public will be 10.0.1.0 and private will be 10.0.2.0."
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

