variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "rds_sg_name" {
  type = string
}

variable "db_subnet_group_name" {
  type = string
}

variable "db_identifier" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_port" {
  type = number
}

variable "db_instance_class" {
  type = string
}

variable "db_allocated_storage" {
  type = number
}

variable "ec2_security_group_id" {
  type = string
}
