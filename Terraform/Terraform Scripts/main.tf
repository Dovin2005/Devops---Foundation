resource "random_id" "rand" {
  byte_length = 4
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*"]
  }
}

data "aws_route53_zone" "main" {
  name         = "dovin.xyz"
  private_zone = false
}
resource "aws_route53_record" "root_domain" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "dovin.xyz"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_acm_certificate" "cert" {
  domain_name       = "dovin.xyz"
  validation_method = "DNS"

  subject_alternative_names = [
    "www.dovin.xyz"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.domain_name => dvo
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [
    for record in aws_route53_record.cert_validation : record.fqdn
  ]
}

# 🔑 Key generation
resource "tls_private_key" "key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = tls_private_key.key.public_key_openssh
}

resource "local_file" "private_key" {
  content  = tls_private_key.key.private_key_pem
  filename = "${var.project_name}-${var.environment}-key.pem"
}

# 🌐 VPC
module "network" {
  source = "./modules/VPC"

  vpc_cidr = var.vpc_cidr

  public_subnet_cidr    = var.public_subnet_cidr
  public_subnet_2_cidr  = var.public_subnet_2_cidr
  private_subnet_1_cidr = var.private_subnet_1_cidr
  private_subnet_2_cidr = var.private_subnet_2_cidr

  availability_zone_1 = var.availability_zone_1
  availability_zone_2 = var.availability_zone_2

  project_name = var.project_name
  environment  = var.environment
}

# 📦 S3
module "s3" {
  source = "./modules/S3"

  bucket_name  = "${var.project_name}-${var.environment}-logs-${random_id.rand.hex}"
  project_name = var.project_name
  environment  = var.environment
}

# 🔐 IAM
module "iam" {
  source      = "./modules/IAM"
  bucket_name = module.s3.bucket_name
}

# 🔥 SG
module "ec2_sg" {
  source = "./modules/EC2-sg"

  vpc_id       = module.network.vpc_id
  project_name = var.project_name
  environment  = var.environment
}

# 🌍 ALB
module "alb" {
  source = "./modules/ALB"

  vpc_id       = module.network.vpc_id
  subnet_ids   = module.network.public_subnet_ids
  project_name = var.project_name
  environment  = var.environment
  certificate_arn = aws_acm_certificate_validation.cert.certificate_arn
}

# ⚙️ ASG
module "autoscaling" {
  source = "./modules/AutoScaling"

  subnet_ids        = module.network.public_subnet_ids
  target_group_arn  = module.alb.target_group_arn
  ami_id            = data.aws_ami.ubuntu.id
  instance_type     = var.instance_type
  key_name          = aws_key_pair.generated.key_name
  instance_profile  = module.iam.instance_profile_name
  security_group_id = module.ec2_sg.security_group_id

  project_name = var.project_name
  environment  = var.environment
}

# 🗄️ RDS
module "rds" {
  source = "./modules/RDS"

  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.private_subnet_ids
  db_username           = var.db_username
  db_password           = var.db_password
  ec2_security_group_id = module.ec2_sg.security_group_id

  project_name = var.project_name
  environment  = var.environment
}
