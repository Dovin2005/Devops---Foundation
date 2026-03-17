output "instance_public_ip" {
  value = module.ec2.instance_public_ip
}

output "private_key_file" {
  value = local_file.private_key.filename
}

output "rds_endpoint" {
  value = module.rds.rds_endpoint
}

output "elastic_ip" {
  value = module.ec2.elastic_ip
}

output "alb_url" {
  value = module.alb.alb_dns
}
