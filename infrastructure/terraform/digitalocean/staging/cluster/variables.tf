variable "region" {
  description="The Digital Ocean region to launch into as our primary region."
  default="nyc3"
}

variable "token" {
  description = "Access token for Digital Ocean API."
}

variable "spaces_access_id" {
  description = "Access id for Digital Ocean Spaces."
}

variable "spaces_secret_key" {
  description = "Access key for Digital Ocean Spaces."
}

