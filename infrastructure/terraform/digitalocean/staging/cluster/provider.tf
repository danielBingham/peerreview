// Configure the digital ocean provider with our API access token.
provider "digitalocean" {
  token = var.token

  spaces_access_id = var.spaces_access_id
  spaces_secret_key = var.spaces_secret_key
}
