variable "domain" {
  description = "The domain name that will be hosting the cluster."
}
variable "hosted_zone_id" {
  description = "The hosted zone id of the parent zone where we'll be launching the cluster."
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
