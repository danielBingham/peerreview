resource "aws_s3_bucket" "this" {
  bucket = "blog.journalhub.org"

  tags = {
      Name = "blog.journalhub.org"
      Resource = "blog.aws_s3_bucket.this"
    }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls   = false 
  block_public_policy = false 
}

data "aws_iam_policy_document" "this" {
  statement {
    sid    = "AllowPublicRead"
    effect = "Allow"
    resources = [
      "arn:aws:s3:::${aws_s3_bucket.this.id}",
      "arn:aws:s3:::${aws_s3_bucket.this.id}/*",
     ]
     actions = ["S3:GetObject"]
     principals {
       type        = "*"
       identifiers = ["*"]
     }
   }
 }

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.this.json
}

resource "aws_s3_bucket_website_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}
