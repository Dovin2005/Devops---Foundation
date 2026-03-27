# 🚀 Launch Template
resource "aws_launch_template" "lt" {
  name_prefix   = "${var.project_name}-${var.environment}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.instance_profile
  }

  # ✅ FIXED (THIS IS THE MAIN CHANGE)
  vpc_security_group_ids = [var.security_group_id]

  lifecycle {
    create_before_destroy = true
  }
}

# 🚀 Auto Scaling Group
resource "aws_autoscaling_group" "asg" {
  name = "${var.project_name}-${var.environment}-asg"

  desired_capacity = 2
  max_size         = 3
  min_size         = 1

  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id      = aws_launch_template.lt.id

    # ❌ OLD (causes replacement every apply)
    # version = "$Latest"

    # ✅ FIX (stable behavior)
    version = aws_launch_template.lt.latest_version
  }

  target_group_arns = [var.target_group_arn]

  health_check_type         = "ELB"
  health_check_grace_period = 120

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg"
    propagate_at_launch = true
  }

  # ❌ REMOVE THIS COMPLETELY
  # lifecycle {
  #   create_before_destroy = true
  # }
}

# 🚀 Auto Scaling Policy
resource "aws_autoscaling_policy" "cpu_policy" {
  name                   = "${var.project_name}-${var.environment}-cpu-policy"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.asg.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 50.0
  }
}
