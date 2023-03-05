variable "vpc_id" {
  description = "The id of the VPC to launch the cluster into."
}

variable "private_subnet_ids" {
  description = "The private subnets to associate with the cluster.  These will be used for the node groups."
  type = list(any)
}

variable "public_subnet_ids" {
  description = "The public subnets to associate with the cluster.  These will be used for ELBs for the ingress."
  type = list(any)
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
