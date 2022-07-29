resource "digitalocean_spaces_bucket" "peer_review_files" {
  name = "peer-review-files"
  region = var.region 
  acl = "public-read"
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
    size = "s-1vcpu-2gb"
    node_count = 2
  }
} 


resource "digitalocean_database_firewall" "peer_review_database_firewall" {
  cluster_id = digitalocean_database_cluster.peer_review_database.id

  rule {
    type  = "ip_addr"
    value = var.admin_ip 
  }

  rule {
      type = "k8s"
      value = digitalocean_kubernetes_cluster.peer_review_cluster.id
  }
}

provider "kubernetes" {
  host             = data.digitalocean_kubernetes_cluster.example.endpoint
  token            = data.digitalocean_kubernetes_cluster.example.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.example.kube_config[0].cluster_ca_certificate
  )
}

resource "kubernetes_secret" "example" {
  metadata {
    name = "basic-auth"
  }

  data = {
    username = "admin"
    password = "P4ssw0rd"
  }

  type = "kubernetes.io/basic-auth"
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


