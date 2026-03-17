resource "aws_security_group" "ec2_sg" {
  name   = var.ec2_sg_name
  vpc_id = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "server" {
  count = var.instance_count

  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = var.subnet_ids[count.index % length(var.subnet_ids)]

  iam_instance_profile = var.instance_profile

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  tags = {
    Name = var.instance_names[count.index]
  }
}

resource "aws_eip" "ec2_eip" {
  count = var.instance_count

  instance = aws_instance.server[count.index].id
  domain   = "vpc"

  tags = {
    Name = "${var.instance_names[count.index]}-eip"
  }
}

