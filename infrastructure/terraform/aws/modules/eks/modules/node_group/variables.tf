variable "cluster_name" {
  description = "The name of the EKS cluster we're creating this node group for."
}

variable "vpc_id" {
  description = "The id of the VPC the node group is being launched into."
}

variable "subnet_ids" {
  description = "The subnets we want to launch the node group into."
}

variable "cluster_security_group_id" {
  description = "The id of the cluster security group.  Used to add ingress and egress rules allowing communication between the cluster control plane and the node group."
}

variable "group_name" {
  description = "The name of this node group."
}

variable "ami_type" {
  description = "The type of AMI we want to launch the node group with.  EG. AL2_x86_64"
}

variable "capacity_type" {
  description = "The capacity type we want to create the node group with. EG. ON_DEMAND"
}

variable "disk_size" {
  description = "The size of EBS volume we'd like to use for the nodes.  Each node will have it's own."
}

variable "instance_types" {
  description = "The types of instances we want the node group to be able to use."
  type = list(any)
}

variable "desired_size" {
  description = "The number of nodes we want the node group to target."
}

variable "max_size" {
  description = "The maximum number of nodes we want the node group to be able to scale to at need."
}

variable "min_size" {
  description = "The minimum number of nodes we want the node group to scale down to."
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
