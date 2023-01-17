locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "storage"
  }
}


resource "aws_s3_bucket" "this" {
  bucket = "${var.application}-${var.environment}-${var.service}"

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-bucket"
      Resource = "s3.aws_s3_bucket.this"
    }
  )
}

resource "aws_s3_bucket_acl" "this" {
  bucket = aws_s3_bucket.this.id

  acl = "public-read"
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_methods = [ "GET" ]
    allowed_origins = [ var.domain ]
  }
}
