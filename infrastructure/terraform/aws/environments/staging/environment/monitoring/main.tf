/******************************************************************************
 * Monitoring for the Staging Environment
 *
 * Dependencies:
 * - Core 
 *
 ******************************************************************************/

module "monitoring" {
  source = "../../components/monitoring"

  alarm_email = var.alarm_email 
  database_id = var.database_id
  eks_node_group_resources = var.eks_node_group_resources
}
