resource "aws_launch_template" "app" {
  name_prefix   = "terraform-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.instance_profile
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [var.security_group_id]
  }

  user_data = base64encode(<<EOF
#!/bin/bash
apt update -y
apt install -y nginx

echo "<h1>Hello from $(hostname)</h1>" > /var/www/html/index.html

systemctl start nginx
systemctl enable nginx
EOF
  )
}

resource "aws_autoscaling_group" "asg" {
  name               = "terraform-asg"
  desired_capacity   = 2
  max_size           = 5
  min_size           = 2

  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  # 🔥 Connect ASG to ALB
  target_group_arns = [var.target_group_arn]

  # ✅ VERY IMPORTANT (for ALB health)
  health_check_type         = "ELB"
  health_check_grace_period = 60

  # ✅ NAME TAG FOR INSTANCES
  tag {
    key                 = "Name"
    value               = var.instance_name
    propagate_at_launch = true
  }

  # Optional but good practice
  lifecycle {
    create_before_destroy = true
  }
}
