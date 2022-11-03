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

resource "digitalocean_database_cluster" "peer_review_database" {
  name = "peer-review-database-production"
  engine = "pg"
  version = "14"
  size = "db-s-1vcpu-2gb"
  region = var.region
  node_count = 1
}


resource "digitalocean_kubernetes_cluster" "peer_review_cluster" {
  name = "peer-review-cluster-production"
  region = var.region
  version = "1.23.10-do.0"

  node_pool {
    name = "primary-pool"
    size = "s-2vcpu-2gb"
    node_count = 4
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

  name = "peer-review/production"
  description = "A diamond open access academic publishing platform."
  purpose = "Academic Publishing"
  environment = "Production"

  resources = [
    digitalocean_spaces_bucket.peer_review_files.urn,
    digitalocean_kubernetes_cluster.peer_review_cluster.urn, 
    digitalocean_database_cluster.peer_review_database.urn
  ]
}


