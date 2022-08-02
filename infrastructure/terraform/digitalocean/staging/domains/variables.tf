variable "app_load_balancer_ip" {
  description = "Ip address of the app's load balancer."
}

variable "region" {
  description="The Digital Ocean region to launch into as our primary region."
  default="nyc3"
}

variable "token" {
  description = "Access token for Digital Ocean API."
}

