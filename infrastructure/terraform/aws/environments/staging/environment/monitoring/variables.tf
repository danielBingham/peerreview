/******************************************************************************
 * Variables for Monitoring for the Staging Environment
 ******************************************************************************/

variable "alarm_email" {
  description = "The email to send alarms to."
}
variable "database_id" {
  description = "The id of the database instance we want to watch."
}
variable "eks_node_group_resources" {
  description = "The list of resources produced for our eks node group."
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
