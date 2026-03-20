# 🚀 Launch Template
resource "aws_launch_template" "lt" {
  name_prefix   = "${var.project_name}-${var.environment}-lt-"
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

  # 🔥 User Data (Install Nginx)
  user_data = base64encode(<<EOF
#!/bin/bash
apt-get update -y
apt-get install -y nginx

systemctl start nginx
systemctl enable nginx

echo "<h1>${var.project_name}-${var.environment}</h1>" > /var/www/html/index.html
EOF
  )

  # 🔥 Ensures updates create new version
  lifecycle {
    create_before_destroy = true
  }
}

# 🚀 Auto Scaling Group
resource "aws_autoscaling_group" "asg" {
  name = "${var.project_name}-${var.environment}-asg"

  desired_capacity = 2   # 👈 default instances
  max_size         = 3   # 👈 scale up limit
  min_size         = 2   # 👈 minimum always running

  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }

  target_group_arns = [var.target_group_arn]

  # 🔥 Health check via ALB
  health_check_type         = "ELB"
  health_check_grace_period = 120

  # 🔥 Enable metrics (optional but good)
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances"
  ]

  # 🔥 Tag EC2 instances
  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg"
    propagate_at_launch = true
  }

  # 🔥 Prevent downtime
  lifecycle {
    create_before_destroy = true
  }
}

# 🚀 Auto Scaling Policy (CPU based)
resource "aws_autoscaling_policy" "cpu_policy" {
  name                   = "${var.project_name}-${var.environment}-cpu-policy"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.asg.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 50.0   # 👈 scale when CPU > 50%
  }
}
