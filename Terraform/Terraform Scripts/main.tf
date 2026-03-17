resource "tls_private_key" "terraform_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "private_key" {
  content  = tls_private_key.terraform_key.private_key_pem
  filename = var.pem_file_name
}

resource "aws_key_pair" "generated_key" {
  key_name   = var.key_name
  public_key = tls_private_key.terraform_key.public_key_openssh
}

data "aws_ami" "ubuntu_latest" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*"]
  }
}

module "network" {
  source = "./modules/network"

  vpc_cidr              = var.vpc_cidr
  public_subnet_cidr    = var.public_subnet_cidr
  private_subnet_1_cidr = var.private_subnet_1_cidr
  private_subnet_2_cidr = var.private_subnet_2_cidr
  availability_zone_1   = var.availability_zone_1
  availability_zone_2   = var.availability_zone_2
}

module "ec2" {
  source = "./modules/ec2"
  instance_count   = 0
  instance_names   = []
  vpc_id           = module.network.vpc_id
  subnet_ids       = module.network.public_subnet_ids
  ami_id           = data.aws_ami.ubuntu_latest.id
  instance_type    = var.instance_type
  key_name         = aws_key_pair.generated_key.key_name
  ec2_name         = var.ec2_name
  ec2_sg_name      = var.ec2_sg_name
  allowed_ssh_cidr = var.allowed_ssh_cidr
  instance_profile = module.iam.instance_profile_name
}

module "rds" {
  source = "./modules/rds"

  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.private_subnet_ids
  rds_sg_name           = var.rds_sg_name
  db_subnet_group_name  = var.db_subnet_group_name
  db_identifier         = var.db_identifier
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  db_port               = var.db_port
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  ec2_security_group_id = module.ec2.security_group_id
}

module "s3_logs" {
  source      = "./modules/s3"
  bucket_name = "terraform-ec2-log-bucket-demo-12345"
}

module "iam" {
  source = "./modules/iam"

  bucket_name = module.s3_logs.bucket_name
}

module "alb" {
  source = "./modules/alb"

  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.ec2.security_group_id
}

module "autoscaling" {
  source = "./modules/autoscaling"

  subnet_ids        = module.network.public_subnet_ids
  target_group_arn  = module.alb.target_group_arn

  ami_id           = data.aws_ami.ubuntu_latest.id
  instance_type    = var.instance_type
  key_name         = aws_key_pair.generated_key.key_name
  instance_profile = module.iam.instance_profile_name
  security_group_id = module.ec2.security_group_id

  instance_name = "web-asg-instance"
}
