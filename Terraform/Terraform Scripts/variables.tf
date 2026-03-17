variable "aws_region" {
  default = "us-east-2"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "private_subnet_1_cidr" {
  default = "10.0.2.0/24"
}

variable "private_subnet_2_cidr" {
  default = "10.0.3.0/24"
}

variable "availability_zone_1" {
  default = "us-east-2a"
}

variable "availability_zone_2" {
  default = "us-east-2b"
}

variable "instance_names" {
  type = list(string)
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_name" {
  default = "Dreams-Technologies"
}

variable "pem_file_name" {
  default = "Dreams-Technologies.pem"
}

variable "ec2_name" {
  default = "Terraform_Build"
}

variable "ec2_sg_name" {
  default = "terraform-ec2-sg"
}

variable "rds_sg_name" {
  default = "terraform-SG"
}

variable "db_subnet_group_name" {
  default = "terraform-db-subnet-group"
}

variable "db_identifier" {
  default = "terraform-default"
}

variable "db_name" {
  default = "RDS"
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  sensitive = true
}

variable "db_port" {
  default = 3306
}

variable "db_instance_class" {
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  default = 20
}

variable "allowed_ssh_cidr" {
  default = "0.0.0.0/0"
}

variable "instance_count" {
  default = 1
}
