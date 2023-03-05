/******************************************************************************
 * Variables for Staging Environment Core
 ******************************************************************************/

variable "database_username" {
  description = "A username to use for the root database user."
}

variable "database_password" {
  description = "A password to use for the root database user."
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
