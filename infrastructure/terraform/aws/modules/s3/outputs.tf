output "domain_name" {
  value = aws_s3_bucket.this.bucket_domain_name
}

output "regional_domain_name" {
  value = aws_s3_bucket.this.bucket_regional_domain_name
}
