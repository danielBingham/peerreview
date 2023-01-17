locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "database"
  }
}

/**
 * A security group to control access to the database.  We'll output its ID to
 * allow other modules to define their own access into the database.
 */
resource "aws_security_group" "this" {
  name = "${var.application}-${var.environment}-${var.service}-database-security-group"
  description = "Allow access to the database instance."
  vpc_id = var.vpc_id

  tags = merge(
    local.tags,
    {
      Resource = "rds.aws_security_group.this"
    }
  )
}

/**
 * Allow unrestricted ingress on the port Postgres will use.
 *
 * TODO Lock this down to our application nodes in the future.
 */
resource "aws_security_group_rule" "ingress" {
  type = "ingress"
  from_port = 5432
  to_port = 5432
  protocol = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
}

/**
 * Allow unrestricted egress on the port Postgres will use.
 *
 * TODO Lock this down to our application nodes in the future.
 */
resource "aws_security_group_rule" "egress" {
  type = "egress"
  from_port = 5432
  to_port = 5432
  protocol = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
}

/**
 * A group of subnets to launch database instances into.
 */
resource "aws_db_subnet_group" "this" {
  name       = "${var.application}-${var.environment}-${var.service}-database"
  subnet_ids = var.subnet_ids  

  tags = merge(
    local.tags,
    {
      Resource = "rds.aws_db_subnet_group.this"
    }
  )
}

/**
 * Define the database instance itself and associate it with the subnet group
 * and security group defined above.
 */
resource "aws_db_instance" "this" {
  identifier             = "${var.application}-${var.environment}-${var.service}-database" 

  instance_class         = var.instance_class 
  allocated_storage      = 20 

  engine                 = "postgres"
  engine_version         = "14.5"

  port                   = 5432 
  username               = var.username
  password               = var.password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [ aws_security_group.this.id ]

  skip_final_snapshot = true

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-db-instance"
      Resource = "rds.aws_db_instance.this"
    }
  )
}

