terraform {
  required_version = ">= 1.3.0"

  backend "s3" {
    bucket         = "terraform-state-bucket-demo-12345"
    key            = "project/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "terraform-lock"
  }

  required_providers {
    aws    = { source = "hashicorp/aws" }
    tls    = { source = "hashicorp/tls" }
    local  = { source = "hashicorp/local" }
    random = { source = "hashicorp/random" }
  }
}

provider "aws" {
  region = var.aws_region
}
