resource "digitalocean_spaces_bucket" "peer_review_files" {
  name = "peer-review-staging-files"
  region = var.region 
  acl = "public-read"

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["http://staging.peer-review.io", "https://staging.peer-review.io"]
    max_age_seconds = 3000
  }
}

resource "digitalocean_database_cluster" "peer_review_database" {
  name = "peer-review-database"
  engine = "pg"
  version = "14"
  size = "db-s-1vcpu-1gb"
  region = var.region
  node_count = 1
}


resource "digitalocean_kubernetes_cluster" "peer_review_cluster" {
  name = "peer-review-cluster"
  region = var.region
  version = "1.23.9-do.0"

  node_pool {
    name = "primary-pool"
    size = "s-2vcpu-2gb"
    node_count = 2
  }
} 


resource "digitalocean_database_firewall" "peer_review_database_firewall" {
  cluster_id = digitalocean_database_cluster.peer_review_database.id

  rule {
      type = "k8s"
      value = digitalocean_kubernetes_cluster.peer_review_cluster.id
  }
}

resource "digitalocean_project" "peer_review" {

  name = "peer-review/staging"
  description = "A diamond open access academic publishing platform."
  purpose = "Academic Publishing"
  environment = "Staging"

  resources = [
    digitalocean_spaces_bucket.peer_review_files.urn,
    digitalocean_kubernetes_cluster.peer_review_cluster.urn, 
    digitalocean_database_cluster.peer_review_database.urn
  ]
}


