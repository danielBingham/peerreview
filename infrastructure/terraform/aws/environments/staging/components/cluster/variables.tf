variable "vpc_id" {
  description = "The id of the VPC we're launching the cluster into."
}
variable "private_subnet_ids" {
  description = "The private subnets to associate with the cluster.  These will be used for the node groups."
  type = list(any)
}
variable "public_subnet_ids" {
  description = "The public subnets to associate with the cluster.  These will be used for ELBs for the ingress."
  type = list(any)
}

variable "aws_config" {
  description = "Path to the AWS config file we want to use."
  default = [ "~/.aws/config" ]
}
variable "aws_credentials" {
  description = "Path to the AWS credentials file we want to use."
  default = [ "~/.aws/credentials" ]
}
variable "aws_profile" {
  description = "AWS profile we want to use."
  default = "terraform"
}
