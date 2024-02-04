/******************************************************************************
 * Root Hosted Zone 
 *
 * This is the root hosted zone for the journalhub.org domain.  This domain
 * will be used for all environemnts, with staging and development environments
 * on sub-domains and production on the root domain.
 *
 * Because of this, we need to define the root zone independently of any
 * environment.
 * ****************************************************************************/

resource "aws_route53_zone" "root" {
  name = "journalhub.org"

  tags = {
    application = "peer-review"
    environment = "all"
    service = "dns"
    layer = "dns"
  }
}

resource "aws_route53_record" "blog_cname" {
  zone_id = aws_route53_zone.root.zone_id
  name = "blog"
  type = "A"

  alias {
    name = "journalhub-blog-bucket"
    zone_id = "Z3AQBSTGFYJSTF"
    evaluate_target_health = true
  }

}

/**
 * Postmark
 */
resource "aws_route53_record" "pm_bounces_cname" {
  zone_id = aws_route53_zone.root.zone_id
  name = "pm-bounces"

  type = "CNAME"
  ttl = 60 

  records = [ "pm.mtasv.net." ]
} 

resource "aws_route53_record" "gmail" {
  zone_id = aws_route53_zone.root.zone_id
  name = ""

  type = "MX"
  ttl = 60 

  records = [
    "1 aspmx.l.google.com.",
    "5 alt1.aspmx.l.google.com.",
    "5 alt2.aspmx.l.google.com.",
    "10 alt3.aspmx.l.google.com.",
    "10 alt4.aspmx.l.google.com."
  ]
}

resource "aws_route53_record" "postmark_verification" {
  zone_id = aws_route53_zone.root.zone_id
  name = var.postmark_confirmation_name 

  type = "TXT"
  ttl = 60

  records = [
    var.postmark_confirmation_record 
  ]
}
