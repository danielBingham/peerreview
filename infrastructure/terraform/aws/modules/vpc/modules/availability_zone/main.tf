
locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "network"
  }
}

/******************************************************************************
* Public Subnet
*******************************************************************************/

/**
 * Creates a public subnet for this availability zone.  Resources launched into
 * this subnet will be auto-assigned a public IP and visible to the public
 * internet.
 */
resource "aws_subnet" "public" {
  vpc_id = var.vpc_id
  cidr_block = "10.0.${var.subnet_base*2+1}.0/24"
  availability_zone = var.availability_zone

  // Configures this subnet to automatically assign public IPs to any resources
  // launched within.
  map_public_ip_on_launch = true

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-public-subnet"
      Resource = "availability_zone.aws_subnet.public"
    }
  )
}

/**
 * Route table for the public subnet.  Defines routes between the subnet and
 * various other parts of the network.  Routes are defined through `aws_route`
 * resources.
 */
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-public-route-table"
      Resource = "availability_zone.aws_route_table.public"
    }
  )
}

/**
 * Link the route table to the public subnet.
 */
resource "aws_route_table_association" "public" {
  subnet_id = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

/**
 * Create a route allowing access to the internet from the public subnet
 * through the internet gateway.
 */
resource "aws_route" "public_subnet_to_internet" {
  route_table_id = aws_route_table.public.id
  gateway_id = var.gateway_id
  destination_cidr_block = "0.0.0.0/0"
}


/**
 * A static IP address to assign to the NAT gateway.  This address will be the
 * address that all resources launched into the private subnet will use when
 * talking to the internet.
 *
 * NOTE Elastic IPs do incur a cost under certain circumstances.  This one
 * shouldn't since it's being associated with a NAT gateway.
 */
resource "aws_eip" "nat_gateway" {
  vpc = true

  depends_on = [var.gateway_id]

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-elastic-ip"
      Resource = "availability_zone.aws_eip.nat_gateway"
    }
  )
}

/**
 * Create a NAT gateway to do network address translation for the resources
 * launched into the private subnet.  The NAT gateway is launched into the
 * public subnet, but serves the private subnet.  
 *
 * Has a dependency on the internet gateway defined in the VPC in order to
 * successfully translate traffic out to the internet.
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * NOTE This resource has monthly running costs.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
resource "aws_nat_gateway" "private_subnet_to_internet" {
  allocation_id = aws_eip.nat_gateway.id
  subnet_id = aws_subnet.public.id

  depends_on = [var.gateway_id]

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-nat-gateway"
      Resource = "availability_zone.aws_nat_gateway.private_subnet_to_internet"
    }
  )
}


/******************************************************************************
* Private Subnet
*******************************************************************************/

/**
 * A private subnet where we can launch resources that we don't want to be
 * accessible from the internet with out some sort of mediation.
 */
resource "aws_subnet" "private" {
  vpc_id = var.vpc_id
  cidr_block = "10.0.${var.subnet_base*2+2}.0/24"
  availability_zone = var.availability_zone

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-private-subnet"
      Resource = "availability_zone.aws_subnet.private"
    }
  )
}

/**
 * A route table for our private subnet.
 */
resource "aws_route_table" "private" {
  vpc_id = var.vpc_id

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-${var.availability_zone}-private-route-table"
      Resource = "availability_zone.aws_route_table.private"
    }
  )
}

/**
 * Link the private subnet to its route table.
 */
resource "aws_route_table_association" "private" {
  subnet_id = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

/**
 * A route allowing access to the internet from the private subnet through the
 * NAT gateway.
 */
resource "aws_route" "private_subnet_to_internet" {
  route_table_id = aws_route_table.private.id
  nat_gateway_id = aws_nat_gateway.private_subnet_to_internet.id
  destination_cidr_block = "0.0.0.0/0"
}


