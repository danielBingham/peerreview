locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "cluster-nodes"
  }
}

/******************************************************************************
 * IAM  
 ******************************************************************************/

/**
 * An IAM role for the node groups.
 *
 * Contains an assume role policy and will have various amazon managed policies
 * attached.
 */
resource "aws_iam_role" "node_group" {
  name = "${var.application}-${var.environment}-${var.service}-node-group-iam-role"

  assume_role_policy = jsonencode(
    {
      Statement = [{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }]
      Version = "2012-10-17"
    }
  )
}

resource "aws_iam_role_policy_attachment" "AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group.name
}

/******************************************************************************
 * Security Group
 * ***************************************************************************/

resource "aws_security_group" "nodes" {
  name = "${var.application}-${var.environment}-${var.service}-${var.group_name}-nodes-security-group"
  description = "Security group for the ${var.group_name} nodes for ${var.application} ${var.environment}"
  vpc_id = var.vpc_id

  tags = merge(
    local.tags,
    {
      Resource = "eks.modules.node_group.aws_security_group.nodes"
    }
  )
}

/**
 * This is Terraform's version of the ALLOW_ALL egress rule that AWS
 * automatically creates, but that terraform removes and forces you to
 * explicitly define.
 */
resource "aws_security_group_rule" "general_egress" {
  type = "egress"
  description = "Allow nodes to access the internet."

  from_port = 0
  to_port = 0
  protocol = "-1"
  cidr_blocks = ["0.0.0.0/0"]

  security_group_id = aws_security_group.nodes.id
}

/******************************************************************************
 * Internode Communication
 ******************************************************************************/

resource "aws_security_group_rule" "node_to_node_tcp" {
  type = "ingress"
  description = "Allow nodes to communicate with each other over TCP."

  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = aws_security_group.nodes.id
  source_security_group_id = aws_security_group.nodes.id
}

resource "aws_security_group_rule" "node_to_node_udp" {
  type = "ingress"
  description = "Allow nodes to communicate with each other over UDP."

  from_port = 0
  to_port = 65535
  protocol = "udp"

  security_group_id = aws_security_group.nodes.id
  source_security_group_id = aws_security_group.nodes.id
}

/******************************************************************************
 * Control plane and node communication
 * ****************************************************************************/

resource "aws_security_group_rule" "control_plane_to_nodes_ingress" {
  type = "ingress"
  description = "Allow the nodes to recieve from the control plane."

  from_port = 1025 
  to_port = 65535
  protocol = "tcp"

  security_group_id = aws_security_group.nodes.id
  source_security_group_id = var.cluster_security_group_id 
}

resource "aws_security_group_rule" "control_plane_to_nodes_egress" {
  type = "egress"
  description = "Allow the control plane to reach out to nodes."

  from_port = 1025 
  to_port = 65535
  protocol = "tcp"

  security_group_id = var.cluster_security_group_id 
  source_security_group_id = aws_security_group.nodes.id
}

/******************************************************************************
 * Control plane and Node Communication via HTTPS
 ******************************************************************************/
resource "aws_security_group_rule" "node_security_group_ingress_from_control_plane_via_https" {
  type = "ingress"
  description = "Allow the nodes to recieve from the control plane via https."

  from_port =  443 
  to_port = 443 
  protocol = "tcp"

  security_group_id = aws_security_group.nodes.id
  source_security_group_id = var.cluster_security_group_id 
}

resource "aws_security_group_rule" "control_plane_egress_to_nodes_via_https" {
  type = "egress"
  description = "Allow the control plane to reach out to nodes via https."

  from_port = 443 
  to_port = 443 
  protocol = "tcp"

  security_group_id = var.cluster_security_group_id 
  source_security_group_id = aws_security_group.nodes.id
}

resource "aws_security_group_rule" "nodes_to_control_plane_ingress_via_https" {
  type = "ingress"
  description = "Allow pods to communicate with the cluster API server via https."

  from_port = 443 
  to_port = 443 
  protocol = "tcp"

  security_group_id = var.cluster_security_group_id 
  source_security_group_id = aws_security_group.nodes.id
}

/******************************************************************************
 * Node Group Definition
 * ****************************************************************************/

/**
 * A worker node group for the web application.  
 */
resource "aws_eks_node_group" "this" {
  cluster_name = var.cluster_name 
  node_group_name = var.group_name 
  node_role_arn = aws_iam_role.node_group.arn

  subnet_ids = var.subnet_ids

  ami_type = var.ami_type 
  capacity_type = var.capacity_type 
  disk_size = var.disk_size 
  instance_types = var.instance_types 

  scaling_config {
    desired_size = var.desired_size 
    max_size = var.max_size 
    min_size = var.min_size 
  }

  tags = merge(
    local.tags,
    {
      Resource = "eks.modules.node_group.aws_eks_node_group.this"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.AmazonEC2ContainerRegistryReadOnly,
    aws_iam_role_policy_attachment.AmazonEKS_CNI_Policy
  ]
}

