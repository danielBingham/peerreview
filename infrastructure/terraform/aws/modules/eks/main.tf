locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "cluster"
  }
}

/******************************************************************************
 * EKS Cluster Definition
 ******************************************************************************/

/**
 * An IAM role for the cluster.
 *
 * Used to associate various managed IAM policies with the cluster to allow it
 * to access other AWS resources.  Uses an assume role policy to allow it to
 * assume the managed roles.
 */
resource "aws_iam_role" "cluster" {
  name = "${var.application}-${var.environment}-${var.service}-cluster-iam-role"

  assume_role_policy = <<POLICY
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "eks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }
POLICY
}

/**
 * Attach the managed `AmazonEKSClusterPolicy` to the cluster's IAM role.
 */
resource "aws_iam_role_policy_attachment" "cluster" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role = aws_iam_role.cluster.name
}

/**
 * Define the EKS Cluster itself.
 */
resource "aws_eks_cluster" "this" {
  name = "${var.application}-${var.environment}-${var.service}-eks-cluster"
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = var.subnet_ids
    endpoint_private_access = true
    endpoint_public_access = true
  }

  tags = merge(
    local.tags,
    {
      Resource = "eks.aws_eks_cluster.this"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.cluster
  ]
}

/******************************************************************************
 * Cluster Node Groups
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

/**
 * A worker node group for the web application.  For now this is our only node group, but in the
 * future we may want to modularize the node group definition to allow for easy creation of
 * additional node groups.
 */
resource "aws_eks_node_group" "this" {
  cluster_name = aws_eks_cluster.this.name
  node_group_name = "webapp"
  node_role_arn = aws_iam_role.node_group.arn

  subnet_ids = var.subnet_ids

  ami_type = "AL2_x86_64"
  capacity_type = "ON_DEMAND"
  disk_size = 20
  instance_types = ["t3a.small"]

  scaling_config {
    desired_size = 2
    max_size = 6
    min_size = 2
  }

  depends_on = [
    aws_iam_role_policy_attachment.AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.AmazonEC2ContainerRegistryReadOnly,
    aws_iam_role_policy_attachment.AmazonEKS_CNI_Policy
  ]
}
