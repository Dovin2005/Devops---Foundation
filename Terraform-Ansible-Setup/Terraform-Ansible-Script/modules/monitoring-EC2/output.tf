output "public_ip" {
  value = aws_eip.monitor_eip.public_ip
}
