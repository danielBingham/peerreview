module "storage" {
  source = "../../../../modules/s3"

  domain = "https://localhost:3000/"

  application = "peer-review" 
  environment = "development" 
  service = "storage" 
}
