/******************************************************************************
 * Variables for Certificate for the Staging Environment
 ******************************************************************************/

variable "hosted_zone_id" {
  description = "The id of the hosted zone that we're managing our DNS in."
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
