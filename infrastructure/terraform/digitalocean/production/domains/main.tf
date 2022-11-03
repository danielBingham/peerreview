resource "digitalocean_domain" "peer_review_domain" {
  name = "peer-review.io"
  ip_address = var.app_load_balancer_ip
}
