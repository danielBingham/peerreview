resource "digitalocean_spaces_bucket" "peer_review_files" {
  name = "peer-review-files"
  region = var.region 
  acl = "public-read"

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["http://peer-review.io", "https://peer-review.io"]
    max_age_seconds = 3000
  }
}
