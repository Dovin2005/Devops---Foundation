output "alb_url" {
  value = module.alb.alb_dns
}

output "rds_endpoint" {
  value = module.rds.rds_endpoint
}

output "monitor_public_ip" {
  value = module.monitoring.public_ip
}

output "domain_name" {
  value = aws_route53_record.root_domain.name
}
