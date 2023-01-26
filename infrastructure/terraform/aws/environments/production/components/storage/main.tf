module "storage" {
  source = "../../../../modules/s3"

  domain = "https://staging.peer-review.io"

  application = "peer-review" 
  environment = "staging" 
  service = "storage" 
}
