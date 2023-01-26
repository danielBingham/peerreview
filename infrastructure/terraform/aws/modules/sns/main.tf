resource "aws_sns_topic" "alarms" {
  name = "${var.application}-${var.environment}-${var.service}-alarms"
}

resource "aws_sns_topic_subscription" "alarm_subscription" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol = "email"
  endpoint = var.alarm_email
}
