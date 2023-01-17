variable "vpc_id" {
  description = "The id of the VPC we'll be launching this bastion into."
}

variable "subnet_id" {
  description = "A subnet id that we want to launch this bastion into."
}

variable "public_key_path" {
  description = "File path to the public key for the key pair you want to use to login to the bastion instance on the local machine."
}


variable "application" {
  description = "The name of the application this module is supporting."
}

variable "environment" {
  description = "The name of the environment this module is supporting."
}

variable "service" {
  description = "The name of the service this module is supporting." 
}
