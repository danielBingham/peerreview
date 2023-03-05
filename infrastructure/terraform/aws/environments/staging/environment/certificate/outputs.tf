/******************************************************************************
 * Outputs for Certificate for the Staging Environment
 ******************************************************************************/
output "load_balancer_certificate_arn" {
  value = module.certificate_component.load_balancer_certificate_arn 
}
