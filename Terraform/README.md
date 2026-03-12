# Terraform Learning Notes – End-to-End Practical Guide

## Overview

Today I practiced **Infrastructure as Code (IaC)** using Terraform to automate infrastructure creation in AWS.
Instead of manually creating resources in the AWS Console, Terraform allows us to **define infrastructure using code** and manage it consistently.

Terraform interacts with **AWS APIs** to create, modify, and destroy infrastructure resources such as EC2 instances, security groups, and Elastic IPs.

---

# 1. What is Terraform

Terraform is an **Infrastructure as Code tool** used to automate cloud infrastructure.

Instead of manually launching services in AWS:

Manual Process

```
Login AWS → Launch EC2 → Configure Security Group → Attach Key → Configure Networking
```

Terraform Process

```
Write Code → terraform plan → terraform apply
```

Terraform automatically creates the infrastructure defined in code.

Benefits:

* Automation
* Version control
* Reproducibility
* Team collaboration
* Infrastructure management through code

---

# 2. Terraform Workflow

Terraform always follows this workflow:

```
Write configuration (.tf files)
        ↓
terraform init
        ↓
terraform plan
        ↓
terraform apply
```

### terraform init

Initializes the working directory and downloads required providers.

Example:

```
terraform init
```

### terraform plan

Shows what Terraform will create, update, or delete.

Example:

```
terraform plan
```

Output example:

```
Plan: 1 to add, 0 to change, 0 to destroy
```

### terraform apply

Executes the infrastructure changes.

Example:

```
terraform apply
```

---

# 3. Installing Terraform and AWS CLI

### Terraform installation (Mac)

Verify installation:

```
terraform -v
```

Example output:

```
Terraform v1.x.x
```

---

### Install AWS CLI

```
brew install awscli
```

Verify installation:

```
aws --version
```

---

# 4. AWS Authentication

Terraform needs AWS credentials.

Create IAM user with:

```
Access Key
Secret Key
```

Configure AWS CLI:

```
aws configure
```

Example configuration:

```
AWS Access Key ID
AWS Secret Access Key
Region: ap-south-1
Output format: json
```

---

# 5. Terraform Configuration Files

Terraform configuration files use **.tf extension**.

Example files used in the project:

```
provider.tf
keypair.tf
ami.tf
ec2.tf
security-group.tf
elastic-ip.tf
```

Terraform automatically loads all `.tf` files in the same folder.

---

# 6. Terraform Provider

Providers allow Terraform to interact with cloud platforms.

Example:

```
provider "aws" {
  region = "ap-south-1"
}

provider "aws" {
  alias  = "east"
  region = "us-east-1"
}
```

This allows deployment in:

* Mumbai Region
* Virginia Region

---

# 7. Terraform Resources

Resources define infrastructure components.

Example EC2 instance:

```
resource "aws_instance" "mumbai_server" {
  ami           = data.aws_ami.ubuntu_mumbai.id
  instance_type = "t3.micro"
}
```

Terraform creates the instance when running:

```
terraform apply
```

---

# 8. Terraform Data Sources

Data sources allow fetching existing AWS information.

Example: Getting latest Ubuntu AMI.

```
data "aws_ami" "ubuntu_mumbai" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
```

Benefits:

* Always fetches latest image
* No manual AMI lookup required

---

# 9. Terraform State File

Terraform keeps track of infrastructure using:

```
terraform.tfstate
```

This file stores:

* EC2 instance IDs
* Security group IDs
* Elastic IPs
* Resource mappings

Example state entry:

```
aws_instance.mumbai_server
Instance ID: i-xxxxxxxx
```

Terraform compares:

```
Configuration (.tf files)
vs
State file
vs
Actual AWS infrastructure
```

---

# 10. Splitting Terraform Files

Instead of a single large file, the project was split into multiple files.

Project structure:

```
EC2-Instances/
│
├── provider.tf
├── keypair.tf
├── ami.tf
├── ec2.tf
├── security-group.tf
├── elastic-ip.tf
├── terraform.tfstate
└── terraform-key.pem
```

Benefits:

* cleaner code
* easier maintenance
* scalable infrastructure

---

# 11. Generating SSH Key with Terraform

Terraform can generate SSH keys automatically.

Example:

```
resource "tls_private_key" "terraform_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
```

Saving private key locally:

```
resource "local_file" "private_key" {
  content  = tls_private_key.terraform_key.private_key_pem
  filename = "terraform-key.pem"
}
```

---

# 12. Creating AWS Key Pair

```
resource "aws_key_pair" "mumbai_key" {
  key_name   = "Majala"
  public_key = tls_private_key.terraform_key.public_key_openssh
}
```

Used for SSH access to EC2 instances.

---

# 13. Creating Security Groups

Security groups control network access.

Example:

```
resource "aws_security_group" "mumbai_sg" {
  name = "terraform-mumbai-ssh"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Allows SSH access.

---

# 14. Multi-Region Infrastructure

Terraform can deploy infrastructure across multiple AWS regions.

Example:

```
provider "aws" {
  alias  = "east"
  region = "us-east-1"
}
```

Example EC2 in Virginia:

```
resource "aws_instance" "east_server" {
  provider = aws.east
}
```

---

# 15. Elastic IP

By default EC2 instances have **temporary public IPs**.

When instance stops and starts:

```
Public IP changes
```

Solution: Elastic IP.

Example:

```
resource "aws_eip" "mumbai_eip" {
  instance = aws_instance.mumbai_server.id
  domain   = "vpc"
}
```

This creates a static IP and attaches it automatically.

---

# 16. Terraform Dependency Graph

Terraform automatically determines resource order.

Example dependency:

```
EC2 instance
      ↓
Elastic IP
```

Terraform creates:

```
EC2 → Elastic IP → Attach to instance
```

---

# 17. Terraform CLI Commands Learned

```
terraform init
terraform plan
terraform apply
terraform destroy
terraform state list
```

Example:

```
terraform state list
```

Output:

```
aws_instance.mumbai_server
aws_instance.east_server
aws_key_pair.mumbai_key
```

---

# 18. AWS CLI Commands Used

List EC2 instances:

```
aws ec2 describe-instances
```

Filter output:

```
aws ec2 describe-instances \
--region ap-south-1 \
--query 'Reservations[].Instances[].{InstanceID:InstanceId,State:State.Name}' \
--output table
```

---

# 19. Errors Encountered

### Key pair not found

```
InvalidKeyPair.NotFound
```

Solution:
Create key pair in Terraform.

---

### AMI not found

```
InvalidAMIID.NotFound
```

Solution:
Use correct AMI for the region.

---

### Free tier instance error

```
instance type not eligible for free tier
```

Solution:
Use:

```
t2.micro
t3.micro
```

---

### Elastic IP limit reached

```
AddressLimitExceeded
```

Solution:

Release unused Elastic IPs.

---

# 20. What I Learned Today

Key Terraform concepts learned:

* Infrastructure as Code
* Terraform workflow
* AWS provider configuration
* Terraform resources
* Data sources
* Terraform state management
* Splitting Terraform configuration files
* Multi-region deployment
* Automatic SSH key generation
* Security groups
* Elastic IP attachment
* Terraform dependency graph
* AWS CLI integration

---

# 21. Next Topics to Learn

Recommended Terraform learning roadmap:

### Terraform Modules

Reusable infrastructure components.

### Remote State

Store state in S3.

### State Locking

Use DynamoDB.

### Terraform Variables

### Terraform Outputs

### Terraform Workspaces

### Terraform CI/CD Integration

Example tools used with Terraform:

* GitHub Actions
* Jenkins
* GitLab CI

---



