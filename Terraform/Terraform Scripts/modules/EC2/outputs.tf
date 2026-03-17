output "instance_id" {
  value = aws_instance.server[*].id
}

output "instance_public_ip" {
  value = aws_instance.server[*].public_ip
}

output "security_group_id" {
  value = aws_security_group.ec2_sg.id
}

output "elastic_ip" {
  value = aws_eip.ec2_eip[*].public_ip
}
