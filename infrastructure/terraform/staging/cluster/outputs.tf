output "database_user" {
  value = digitalocean_database_cluster.peer_review_database.user
}

output "database_password" {
  value = digitalocean_database_cluster.peer_review_database.password
  sensitive = true
}

output "database_host" {
  value = digitalocean_database_cluster.peer_review_database.host
}
