locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "network"
  }
}

/**
 * This is our root VPC. 
 */
resource "aws_vpc" "this" {
  cidr_block = "10.0.0.0/16"

  // This is required by EKS.
  enable_dns_hostnames = true

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-vpc"
      Resource = "vpc.aws_vpc.this"
    }
  )
}

/**
 * The internet gateway exists on the VPC level and allows traffic to flow from
 * the VPC to the wider internet.  It provides IP translation for the VPC's
 * resources.
 */
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-internet-gateway"
      Resource = "vpc.aws_internet_gateway.this"
    }
  )
}

/**
 * This module defines subnets for an availability zone.  All resources that
 * exist on the subnet level are defined with in.
 */
module "availability_zone" {
  count = length(var.availability_zones)

  source = "./modules/availability_zone"

  vpc_id = aws_vpc.this.id
  gateway_id = aws_internet_gateway.this.id

  // This is used to calculate the base CIDR for the subnet and avoid address
  // space collisions.
  subnet_base = count.index

  // TODO We're currently taking these as a variable, but we really don't care
  // which zones we launch into, so we should just be loading available zones
  // using the `data` resource, taking `count` as a variable, and picking the
  // first `count` zones.
  availability_zone = var.availability_zones[count.index] 

  application = var.application
  environment = var.environment
  service = var.service
}
