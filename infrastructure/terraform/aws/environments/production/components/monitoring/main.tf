module "sns" {
  source = "../../../../modules/sns"

  alarm_email = var.alarm_email 

  application = "peer-review"
  environment = "production"
  service = "monitoring"
}

