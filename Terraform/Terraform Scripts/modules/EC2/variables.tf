variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "key_name" {
  type = string
}

variable "ec2_name" {
  type = string
}

variable "ec2_sg_name" {
  type = string
}

variable "allowed_ssh_cidr" {
  type = string
}

variable "instance_profile" {
  type = string
}

variable "instance_names" {
  type = list(string)
}

variable "instance_count" {
  type = number
}
