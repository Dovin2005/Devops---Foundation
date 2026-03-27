variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "certificate_arn" {
  type = string
}
