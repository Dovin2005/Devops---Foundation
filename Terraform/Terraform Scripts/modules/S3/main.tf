resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket_name

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}
