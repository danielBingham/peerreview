/******************************************************************************
 * Variables for Bastion for the Staging Environment
 ******************************************************************************/

variable "vpc_id" {
  description = "The id of the VPC we'll be launching this bastion into."
}
variable "public_subnet_ids" {
  description = "A list of public subnet ids that we want to launch bastions into."
}
variable "public_key_path" {
  description = "File path to the public key for the key pair you want to use to login to the bastion instance on the local machine."
}

// =========== Provider Variables =========================

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
