locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "network"
  }
}

# A security group allowing ingress from the internet through ssh, and
# unfiltered egress to the internet.
resource "aws_security_group" "this" {
  name = "${var.application}-${var.environment}-${var.service}-allow-ssh-to-bastion-for-${var.subnet_id}"
  description = "Allow ssh access to the bastion host."
  vpc_id = var.vpc_id

  ingress {
    description = "SSH from the internet."
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Egress to the internet."
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    {
      Resource = "bastion.aws_security_group.this"
    }
  )
}

# Define a key pair that will be used to enable ssh access to the instance.
resource "aws_key_pair" "this" {
  key_name = "${var.application}-${var.environment}-${var.service}-bastion-key-pair-for-${var.subnet_id}"
  public_key = file(var.public_key_path)

  tags = merge(
    local.tags,
    {
      Resource = "bastion.aws_key_pair.this"
    }
  )
}

# Get the latest Amazon Linux 2 AMI.
data "aws_ami" "this" {
  most_recent = true

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name = "architecture"
    values = ["arm64"]
  }

  filter {
    name = "name"
    values = [ "amzn2-ami-kernel-5.10-hvm-*-arm64-gp2" ]
  }

  owners = ["amazon"]
}

# The Bastion instance itself.
resource "aws_instance" "this" {
  instance_type = "t4g.nano"
  ami = data.aws_ami.this.id

  associate_public_ip_address = true

  subnet_id = var.subnet_id
  vpc_security_group_ids = [aws_security_group.this.id]

  key_name = aws_key_pair.this.key_name

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-bastion-for-${var.subnet_id}"
      Resource = "bastion.aws_instance.this"
    }
  )
}
