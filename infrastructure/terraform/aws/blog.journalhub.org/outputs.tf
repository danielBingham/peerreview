output "domain_name" {
  value = aws_s3_bucket.this.bucket_domain_name
}

output "regional_domain_name" {
  value = aws_s3_bucket.this.bucket_regional_domain_name
}

output "hosted_zone_id" {
  value = aws_s3_bucket.this.hosted_zone_id
}

output "website_domain" {
  value = aws_s3_bucket_website_configuration.this.website_domain
}

output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.this.website_endpoint
}
