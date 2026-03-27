# 🔐 Security Group for Monitoring
resource "aws_security_group" "monitor_sg" {
  name   = "${var.project_name}-${var.environment}-monitor-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9090
    to_port     = 9090
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

# 🚀 EC2 Instance
resource "aws_instance" "monitor" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.monitor_sg.id]
  key_name               = var.key_name

  tags = {
    Name = "${var.project_name}-${var.environment}-monitor"
  }
}

# 🌐 Elastic IP
resource "aws_eip" "monitor_eip" {
  instance = aws_instance.monitor.id
  domain   = "vpc"
}
