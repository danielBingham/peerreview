variable "application" {
  description = "The name of the application this module is supporting."
}

variable "environment" {
  description = "The name of the environment this module is supporting."
}

variable "service" {
  description = "The name of the service this module is supporting." 
}
variable "domain" {
  description = "The domain the application will be running on.  Used for CORS."
}
