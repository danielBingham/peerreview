output "root_zone_arn" {
  value = aws_route53_zone.root.arn
}

output "root_zone_id" {
  value = aws_route53_zone.root.zone_id
}

output "root_zone_name_servers" {
  value = aws_route53_zone.root.name_servers
}

output "root_zone_primary_name_server" {
  value = aws_route53_zone.root.primary_name_server
}
