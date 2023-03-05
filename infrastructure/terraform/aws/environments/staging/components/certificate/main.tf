/******************************************************************************
 * Managed Certificate for the Load Balancer
 * ****************************************************************************/

resource "aws_acm_certificate" "load_balancer" {
  domain_name = var.domain
  validation_method = "DNS"
}

resource "aws_route53_record" "load_balancer_validation" {
  for_each = {
    for dvo in aws_acm_certificate.load_balancer.domain_validation_options: dvo.domain_name => {
      name = dvo.resource_record_name
      record = dvo.resource_record_value
      type = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name = each.value.name
  records = [ each.value.record ]
  ttl = 300
  type = each.value.type
  zone_id = var.hosted_zone_id
}

resource "aws_acm_certificate_validation" "load_balancer_validation" {
  certificate_arn = aws_acm_certificate.load_balancer.arn
  validation_record_fqdns = [for record in aws_route53_record.load_balancer_validation : record.fqdn]
}
