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
 * Create an aurora postgres cluster with a single primary instance.
 */
resource "aws_rds_cluster" "this" {
  cluster_identifier      = "${var.application}-${var.environment}-${var.service}-cluster"
  availability_zones      = [ "us-east-1a", "us-east-1c", "us-east-1d"]

  engine = "aurora-postgresql"
  engine_version         = "14.5"

  port                   = 5432 

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [ aws_security_group.this.id ]

  master_username         = var.username 
  master_password         = var.password 

  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  
  skip_final_snapshot = true

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-database-cluster"
      Resource = "rds_cluster.aws_rds_cluster.this"
    }
  )
}

/**
 * Create our primary instance.
 */
resource "aws_rds_cluster_instance" "primary" {
  cluster_identifier = aws_rds_cluster.this.cluster_identifier
  identifier             = "${var.application}-${var.environment}-${var.service}" 

  engine = "aurora-postgresql"
  promotion_tier = 1

  instance_class         = var.instance_class 

  db_subnet_group_name   = aws_db_subnet_group.this.name

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-database-primary"
      Resource = "rds_cluster.aws_rds_cluster_instance.primary"
    }
  )
}


