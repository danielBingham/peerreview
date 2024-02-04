variable "postmark_confirmation_name" {
  description = "Value to use for the name of the postmark confirmation record."
}
variable "postmark_confirmation_record" {
  description = "Value to use for the record of the postmark confirmation record."
}
variable "google_site_verification_record" {
  description = "Google site verification text record value."
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
