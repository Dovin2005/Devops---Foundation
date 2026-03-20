variable "project_name" { default = "myapp" }
variable "environment"  { default = "dev" }

variable "aws_region" { default = "us-east-2" }

variable "vpc_cidr" { default = "10.0.0.0/16" }

variable "public_subnet_cidr" {}
variable "public_subnet_2_cidr" {}

variable "private_subnet_1_cidr" {}
variable "private_subnet_2_cidr" {}

variable "availability_zone_1" {}
variable "availability_zone_2" {}

variable "instance_type" { default = "t3.micro" }

variable "db_username" {}
variable "db_password" {
  type      = string
  sensitive = true
}

variable "certificate_arn" {
  type = string
}
