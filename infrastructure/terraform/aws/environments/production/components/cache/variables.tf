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

variable "vpc_id" {
  description = "Id of the VPC you want to launch the database into."
}

variable "subnet_ids" {
  description = "Subnet ids to launch the database into."
  type = list(any)
}
