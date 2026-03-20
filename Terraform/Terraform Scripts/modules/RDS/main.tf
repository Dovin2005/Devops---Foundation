resource "aws_db_subnet_group" "db" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.subnet_ids   # ✅ these should be PRIVATE subnets

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet"
  }
}

resource "aws_security_group" "rds_sg" {
  vpc_id = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]  # only EC2 can access
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

resource "aws_db_instance" "db" {
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "mysql"
  instance_class = "db.t3.micro"

  username = var.db_username
  password = var.db_password

  allocated_storage      = 20
  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  skip_final_snapshot = true

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
  }
}
