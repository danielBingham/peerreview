locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "redis"
  }
}

/**
 * A security group to control access to the redis.  We'll output its ID to
 * allow other modules to define their own access into the redis.
 */
resource "aws_security_group" "this" {
  name = "${var.application}-${var.environment}-${var.service}-redis-security-group"
  description = "Allow access to the redis instance."
  vpc_id = var.vpc_id

  tags = merge(
    local.tags,
    {
      Resource = "elasticache.aws_security_group.this"
    }
  )
}

/**
 * Allow unrestricted ingress on the port ElastiCache will use.
 *
 * TODO Lock this down to our worker and application nodes in the future.
 */
resource "aws_security_group_rule" "ingress" {
  type = "ingress"
  from_port = 6379
  to_port = 6379 
  protocol = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
}

/**
 * Allow unrestricted egress on the port ElastiCache will use.
 *
 * TODO Lock this down to our worker and application nodes in the future.
 */
resource "aws_security_group_rule" "egress" {
  type = "egress"
  from_port = 6379 
  to_port = 6379 
  protocol = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
}

/**
 * A subnet group for the Redis instance, defining which subnets we should be
 * launching nodes into.
 */
resource "aws_elasticache_subnet_group" "this" {
  name  = "${var.application}-${var.environment}-${var.service}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    local.tags,
    {
      Resource = "elasticache.aws_elasticache_subnet_group.this"
    }
  )
}

/**
 * Create a single node elasticache Redis cluster.
 */
resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.application}-${var.environment}-${var.service}-redis-cluster"
  engine               = "redis"
  
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"

  subnet_group_name   = aws_elasticache_subnet_group.this.name
  security_group_ids = [ aws_security_group.this.id ]
  
  port                 = 6379

  tags = merge(
    local.tags,
    {
      Resource = "elasticache.aws_elasticache_cluster.this"
    }
  )
}
