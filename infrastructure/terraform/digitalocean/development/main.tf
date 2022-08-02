resource "digitalocean_spaces_bucket" "peer_review_files" {
  name = "peer-review-development-files"
  region = var.region 
  acl = "public-read"
}

resource "digitalocean_project" "peer_review" {

  name = "peer-review/development"
  description = "A diamond open access academic publishing platform."
  purpose = "Academic Publishing"
  environment = "Development"

  resources = [
    digitalocean_spaces_bucket.peer_review_files.urn,
  ]
}
