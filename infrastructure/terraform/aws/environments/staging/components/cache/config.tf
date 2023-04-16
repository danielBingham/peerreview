terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  shared_config_files = var.aws_config
  shared_credentials_files = var.aws_credentials
  profile = var.aws_profile
}
