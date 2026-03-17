resource "aws_s3_bucket" "ec2_logs" {
  bucket = var.bucket_name

  tags = {
    Name = "ec2-log-bucket"
  }
}
