module "storage" {
  source = "../../../../modules/s3"

  domain = "https://peer-review.io"

  application = "peer-review" 
  environment = "production" 
  service = "storage" 
}
