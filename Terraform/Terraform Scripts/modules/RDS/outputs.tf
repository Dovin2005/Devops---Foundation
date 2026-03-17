output "rds_endpoint" {
  value = aws_db_instance.mysql.endpoint
}

output "rds_address" {
  value = aws_db_instance.mysql.address
}

output "rds_port" {
  value = aws_db_instance.mysql.port
}

output "db_name" {
  value = aws_db_instance.mysql.db_name
}

output "db_username" {
  value = aws_db_instance.mysql.username
}
