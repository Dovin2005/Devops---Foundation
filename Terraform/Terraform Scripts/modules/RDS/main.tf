resource "aws_security_group" "rds_sg" {
  name   = var.rds_sg_name
  vpc_id = var.vpc_id

  ingress {
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]
  }
}

resource "aws_db_subnet_group" "main" {
  name = var.db_subnet_group_name
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "mysql" {
  identifier = var.db_identifier
  engine = "mysql"
  instance_class = var.db_instance_class

  username = var.db_username
  password = var.db_password
  db_name = var.db_name
  port = var.db_port

  allocated_storage = var.db_allocated_storage
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  skip_final_snapshot = true
}
