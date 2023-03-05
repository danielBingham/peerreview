/******************************************************************************
 * Certificate for the Staging Environment
 *
 * Dependencies:
 *  None
 ******************************************************************************/

module "certificate_component" {
  source = "../../components/certificate"

  hosted_zone_id = var.hosted_zone_id
  domain = "staging.peer-review.io"
}
