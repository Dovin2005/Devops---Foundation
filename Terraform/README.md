                                                  Terraform  Guide


1. What is Terraform

        Terraform is an **Infrastructure as Code tool** used to automate cloud infrastructure.

        Instead of manually launching services in AWS:

        Manual Process

               Login AWS → Launch EC2 → Configure Security Group → Attach Key → Configure      Networking

Terraform Process

      Write Code → terraform plan → terraform apply

      Terraform automatically creates the infrastructure defined in code.

Benefits:

      * Automation
      * Version control 
      * Reproducibility
      * Team collaboration
      * Infrastructure management through code


2. Terraform Workflow

      Terraform always follows this workflow:

      Write configuration (.tf files)
              ↓
      terraform init
              ↓
      terraform plan
              ↓
      terraform apply

Terraform init : 

      Initializes the working directory and downloads required providers.

Example:

      terraform init

Terraform plan : 

      Shows what Terraform will create, update, or delete.

Example:

      terraform plan

Output example :

           Plan: 1 to add, 0 to change, 0 to destroy

Terraform apply

          Executes the infrastructure changes.

              Example:

                     terraform apply


3. Installing Terraform and AWS CLI

Terraform installation (Mac)

                  Verify installation:

                          terraform -v



          Example output:

                    Terraform v1.x.x

Install AWS CLI : 

               brew install awscli

Verify installation:

                   aws --version


4. AWS Authentication : 

                    Terraform needs AWS credentials.

Create IAM user with :

                         Access Key : AKIA5UW2Y2XFNQ2GAWNN
                         Secret Key :  Bh60fGzs2b7GveChZuqlPvyalO7NkoCvpO5EjqX5

Configure AWS CLI :

             aws configure

Example configuration:

               AWS Access Key ID : Access Key
               AWS Secret Access Key : Secret Access Key 
               Region : ap-south-1
               Output format : json

5. Terraform Configuration Files : 

                       Terraform configuration files use **.tf extension**.

Example files used in the project :



           provider.tf
           keypair.tf 
           ami.tf
           ec2.tf
           security-group.tf
           elastic-ip.tf

Terraform automatically loads all “.tf ” files in the same folder.


6. Terraform Provider :

             Providers allow Terraform to interact with cloud platforms.

Example:

      provider "aws" {
        region = "ap-south-1"
      }

      provider "aws" {
        alias  = "east"
        region = "us-east-1"
      }

This allows deployment in:

           * Mumbai Region
           * Virginia Region


7. Terraform Resources : 

                    Resources define infrastructure components.

Example EC2 instance:



resource "aws_instance" "mumbai_server" {
  ami           = data.aws_ami.ubuntu_mumbai.id
  instance_type = "t3.micro"
}

Terraform creates the instance when running:

                           terraform apply

8. Terraform Data Sources : 

                Data sources allow fetching existing AWS information.

Example: Getting latest Ubuntu AMI.


      data "aws_ami" "ubuntu_mumbai" {
        most_recent = true
        owners      = ["099720109477"]

        filter {
          name   = "name"
          values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
        }
      }

Benefits:

      * Always fetches latest image
      * No manual AMI lookup required


9. Terraform State File : 

      Terraform keeps track of infrastructure using:

      terraform.tfstate



This file stores:

      * EC2 instance IDs
      * Security group IDs
      * Elastic IPs
      * Resource mappings

Example state entry :

      aws_instance.mumbai_server
      Instance ID: i-xxxxxxxx


Terraform compares :

      Configuration (.tf files)
                vs
      State file 
                vs
      Actual AWS infrastructure


10. Splitting Terraform Files

           Instead of a single large file, the project was split into multiple files.

Project structure:

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


Benefits:

      * cleaner code
      * easier maintenance
      * scalable infrastructure


11. Generating SSH Key with Terraform

       Terraform can generate SSH keys automatically.

Example:

      resource "tls_private_key" "terraform_key" {
        algorithm = "RSA"
        rsa_bits  = 4096
      }

      Saving private key locally:

      resource "local_file" "private_key" {
        content  = tls_private_key.terraform_key.private_key_pem
        filename = "terraform-key.pem"
      }

12. Creating AWS Key Pair

      resource "aws_key_pair" "mumbai_key" {
        key_name   = "Majala"
        public_key = tls_private_key.terraform_key.public_key_openssh
      }

Used for SSH access to EC2 instances.

13. Creating Security Groups

        Security groups control network access.



Example:

resource "aws_security_group" "mumbai_sg" {
  name = "terraform-mumbai-ssh"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

Allows SSH access.


14. Multi-Region Infrastructure : 

      Terraform can deploy infrastructure across multiple AWS regions.

      Example:

       provider "aws" {
         alias  = "east"
         region = "us-east-1"
       }

Example EC2 in Virginia :

       resource "aws_instance" "east_server" {
         provider = aws.east
}

15. Elastic IP

      By default EC2 instances have **temporary public IPs**.

      When instance stops and starts:

                        Public IP changes
Solution: Elastic IP.

Example:

      resource "aws_eip" "mumbai_eip" {
        instance = aws_instance.mumbai_server.id
        domain   = "vpc"
      }

      This creates a static IP and attaches it automatically.

16. Terraform Dependency Graph

      Terraform automatically determines resource order.

Example dependency:

           EC2 instance
                 ↓
           Elastic IP

Terraform creates:

      EC2 → Elastic IP → Attach to instance


17. Terraform CLI Commands Learned

        terraform init
        terraform plan
        terraform apply
        terraform destroy
        terraform state list

Example:

      terraform state list

Output:

      aws_instance.mumbai_server
      aws_instance.east_server
      aws_key_pair.mumbai_key

18. AWS CLI Commands Used

      List EC2 instances:

      aws ec2 describe-instances

Filter output:

      aws ec2 describe-instances \
      --region ap-south-1 \
      --query 'Reservations[].Instances[].{InstanceID:InstanceId,State:State.Name}' \
      --output table

19. Errors Encountered

      Key pair not found

      InvalidKeyPair.NotFound

Solution:

      Create a key pair in Terraform.


AMI not found : 

InvalidAMIID.NotFound

Solution:
      Use correct AMI for the region.


Free tier instance error

      instance type not eligible for free tier
 

Solution:
      Use:

      t2.micro
      t3.micro

Elastic IP limit reached

      AddressLimitExceeded

Solution:

      Release unused Elastic IPs.


20. What I Learned Today

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


21. Next Topics to Learn

    Recommended Terraform learning roadmap:

Terraform Modules : 

      Reusable infrastructure components.

Remote State : 

      Store state in S3.

State Locking : 

      Use DynamoDB.

Terraform Variables : 

      Terraform Outputs

Terraform Workspaces : 

      Terraform CI/CD Integration

Example tools used with Terraform:

      * GitHub Actions
      * Jenkins
      * GitLab CI

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Day 02 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
Terraform AWS Infrastructure Setup : 
Overview : 
This project demonstrates how to provision a complete AWS infrastructure using Terraform with a modular architecture.
The infrastructure includes:
VPC
Public and Private Subnets
Internet Gateway
Route Tables
EC2 Instance
RDS MySQL Database
S3 Bucket for log storage
IAM Role for EC2 to access S3
All infrastructure is created using Terraform modules for better organization and scalability.
Architecture : 
     Terraform
     │
     ├── VPC
     │   ├── Public Subnet
     │   │    └── EC2 Instance
     │   │         └── IAM Role
     │   │              └── Access S3 Bucket
     │   │
     │   └── Private Subnets
     │        └── RDS MySQL Database
     │
     └── S3 Bucket
          └── EC2 Logs Storage
Prerequisites : 
     Before starting, ensure the following are installed:
Terraform
AWS CLI
AWS Account
SSH Client
Project Structure : 
         Terraform/
         │
         ├── main.tf
         ├── provider.tf
         ├── variables.tf
         ├── terraform.tfvars
         ├── outputs.tf
         │
         └── modules/
             ├── EC2/
             │     ├── main.tf
             │     ├── variables.tf
             │     └── outputs.tf
             │
             ├── Network/
             │     ├── main.tf
             │     ├── variables.tf
             │     └── outputs.tf
             │
             ├── RDS/
             │     ├── main.tf
             │     ├── variables.tf
             │     └── outputs.tf
             │
             ├── S3/
             │     ├── main.tf
             │     ├── variable.tf
             │     └── outputs.tf
             │
             └── IAM/
                     ├── main.tf
                     ├── variables.tf
                     └── outputs
                     
Step 1 — Configure Terraform Provider

Provider.tf  FILE : 

Defines AWS provider and required Terraform providers.

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}
provider "aws" {
  region = var.aws_region
}

Step 2 — Define Variables : 

Variables.tf  FILES : 

Stores configurable parameters such as:
AWS region
VPC CIDR
Subnet CIDR
Instance type
Database credentials

variable "aws_region" {
  default = "us-east-2"
}
variable "vpc_cidr" {
  default = "10.0.0.0/16"
}
variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}
variable "private_subnet_1_cidr" {
  default = "10.0.2.0/24"
}
variable "private_subnet_2_cidr" {
  default = "10.0.3.0/24"
}
variable "availability_zone_1" {
  default = "us-east-2a"
}
variable "availability_zone_2" {
  default = "us-east-2b"
}
variable "instance_type" {
  default = "t3.micro"
}
variable "key_name" {
  default = "Dreams-Technologies"
}
variable "pem_file_name" {
  default = "Dreams-Technologies.pem"
}
variable "ec2_name" {
  default = "Terraform_Build"
}
variable "ec2_sg_name" {
  default = "terraform-ec2-sg"
}
variable "rds_sg_name" {
  default = "terraform-SG"
}
variable "db_subnet_group_name" {
  default = "terraform-db-subnet-group"
}
variable "db_identifier" {
  default = "terraform-default"
}
variable "db_name" {
  default = "RDS"
}
variable "db_username" {
  default = "admin"
}
variable "db_password" {
  sensitive = true
}
variable "db_port" {
  default = 3306
}
variable "db_instance_class" {
  default = "db.t3.micro"
}
variable "db_allocated_storage" {
  default = 20
}
variable "allowed_ssh_cidr" {
  default = "0.0.0.0/0"
}
Step 3 — Store Sensitive Variables : 
File: terraform.tfvars
db_password = "MySecurePassword123"

Outputs.tf  FILE 

output "instance_public_ip" {
  value = module.ec2.instance_public_ip
}
output "private_key_file" {
  value = local_file.private_key.filename
}
output "rds_endpoint" {
  value = module.rds.rds_endpoint
}
Step 4 — Generate SSH Key Pair : 
Terraform automatically generates a private key and uploads the public key to AWS.
resource "tls_private_key" "terraform_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "private_key" {
  content  = tls_private_key.terraform_key.private_key_pem
  filename = var.pem_file_name
}

resource "aws_key_pair" "generated_key" {
  key_name   = var.key_name
  public_key = tls_private_key.terraform_key.public_key_openssh
}
Step 5 — Create Network Module : 
The Network module creates:

VPC
Internet Gateway
Public Subnet
Private Subnets
Route Table
Route Table Association
This ensures the EC2 instance receives internet access.

main.tf  FILE
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "terraform-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "terraform-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone_1
  map_public_ip_on_launch = true
  tags = {
    Name = "terraform-public-subnet"
  }
}

# Private Subnet 1
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_1_cidr
  availability_zone = var.availability_zone_1
  tags = {
    Name = "terraform-private-subnet-1"
  }
}

# Private Subnet 2
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = var.availability_zone_2
  tags = {
    Name = "terraform-private-subnet-2"
  }
}

# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "terraform-public-rt"
  }
}

# Route to Internet Gateway
resource "aws_route" "internet_access" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}
# Associate Route Table with Public Subnet
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}



Variables.tf  FILE

variable "vpc_cidr" {
  type = string
}
variable "public_subnet_cidr" {
  type = string
}
variable "private_subnet_1_cidr" {
  type = string
}
variable "private_subnet_2_cidr" {
  type = string
}
variable "availability_zone_1" {
  type = string
}
variable "availability_zone_2" {
  type = string
}





Output.tf  FILE

output "vpc_id" {
  value = aws_vpc.main.id
}
output "public_subnet_id" {
  value = aws_subnet.public.id
}
output "private_subnet_ids" {
  value = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]
}
Step 6 — Create EC2 Module
main.tf  FILES : 
resource "aws_security_group" "ec2_sg" {
  name   = var.ec2_sg_name
  vpc_id = var.vpc_id
  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_instance" "server" {
  ami = var.ami_id
  instance_type = var.instance_type
  key_name = var.key_name
  subnet_id = var.subnet_id
  iam_instance_profile = var.instance_profile 
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  tags = {
    Name = var.ec2_name
  }
}

Variables.tf  FIlES : 

variable "vpc_id" {
  type = string
}
variable "subnet_id" {
  type = string
}
variable "ami_id" {
  type = string
}
variable "instance_type" {
  type = string
}
variable "key_name" {
  type = string
}
variable "ec2_name" {
  type = string
}
variable "ec2_sg_name" {
  type = string
}
variable "allowed_ssh_cidr" {
  type = string
}
variable "instance_profile" {
  type = string
}

Outputs.tf  FILES :

output "instance_id" {
  value = aws_instance.server.id
}
output "instance_public_ip" {
  value = aws_instance.server.public_ip
}
output "security_group_id" {
  value = aws_security_group.ec2_sg.id
}
 
Step 7 — Create RDS Module : 
The RDS module provisions:
MySQL RDS instance
DB Subnet Group
RDS Security Group
Database settings include:
Engine: MySQL
Instance type: db.t3.micro
Private subnet deployment

main .tf FILE : 
resource "aws_security_group" "rds_sg" {
  name   = var.rds_sg_name
  vpc_id = var.vpc_id
  ingress {
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]
  }
}
resource "aws_db_subnet_group" "main" {
  name = var.db_subnet_group_name
  subnet_ids = var.subnet_ids
}
resource "aws_db_instance" "mysql" {
  identifier = var.db_identifier
  engine = "mysql"
  instance_class = var.db_instance_class
  username = var.db_username
  password = var.db_password
  db_name = var.db_name
  port = var.db_port
  allocated_storage = var.db_allocated_storage
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot = true
}


Variables.tf  FILE : 

variable "vpc_id" {
  type = string
}
variable "subnet_ids" {
  type = list(string)
}
variable "rds_sg_name" {
  type = string
}
variable "db_subnet_group_name" {
  type = string
}
variable "db_identifier" {
  type = string
}
variable "db_name" {
  type = string
}
variable "db_username" {
  type = string
}
variable "db_password" {
  type      = string
  sensitive = true
}
variable "db_port" {
  type = number
}
variable "db_instance_class" {
  type = string
}
variable "db_allocated_storage" {
  type = number
}
variable "ec2_security_group_id" {
  type = string
}


Outputs.tf  FILE : 

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
Step 8 — Create S3 Module : 
The S3 module creates a bucket for storing EC2 logs.

main.tf  FILE : 

resource "aws_s3_bucket" "ec2_logs" {
  bucket = var.bucket_name
  tags = {
    Name = "ec2-log-bucket"
  }
}


Variables.tf  FILE 



variable "bucket_name" {
  type = string
}
Step 9 — Create IAM Module
IAM module creates:
IAM Role
IAM Policy
Instance Profile
This allows EC2 to upload logs to S3.
Policy permissions:
s3:PutObject
s3:GetObject
s3:ListBucket

main.tf  FILE 

resource "aws_iam_role" "ec2_s3_role" {
  name = "ec2-s3-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}
resource "aws_iam_role_policy" "s3_policy" {
  role = aws_iam_role.ec2_s3_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}"
      }
    ]
  })
}
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-s3-profile"
  role = aws_iam_role.ec2_s3_role.name
}

Variables.tf  FILE 

variable "bucket_name" {
  type = string
}


Outputs.tf  FILE : 


output "instance_profile_name" {
  value = aws_iam_instance_profile.ec2_profile.name
}




Step 10 — Attach IAM Role to EC2 : 
Inside EC2 module:
iam_instance_profile = var.instance_profile

This allows EC2 to access S3 without storing AWS credentials.
Step 11 — Initialize Terraform : 

terraform init
Downloads providers and modules.
Step 12 — Plan Infrastructure : 

terraform plan
Shows the resources Terraform will create.
Step 13 — Deploy Infrastructure : 

terraform apply
Terraform provisions:
VPC
Subnets
EC2
RDS
S3
IAM



Step 14 — Verify Terraform State : 

terraform state list
Lists all resources managed by Terraform.
Step 15 — Get Terraform Outputs : 

terraform output
Example output:
instance_public_ip = 3.145.87.20
rds_endpoint = terraform-default.cxg0yq2u4jos.us-east-2.rds.amazonaws.com
Step 16 — Connect to EC2 : 

chmod 400 Dreams-Technologies.pem

ssh -i Dreams-Technologies.pem ubuntu@<EC2_PUBLIC_IP>
Step 17 — Install MySQL Client on EC2 : 

sudo apt update
sudo apt install mysql-client
Step 18 — Connect to RDS Database : 

mysql -h terraform-default.cxg0yq2u4jos.us-east-2.rds.amazonaws.com -u admin -p
Step 19 — Verify Database : 

show databases;

Output:
RDS
information_schema
mysql
performance_schema
sys
Step 20 — Test EC2 → RDS Connectivity

nc -zv <RDS_ENDPOINT> 3306
Connection succeeded confirms network and security group configuration is correct.
Step 21 — Test EC2 → S3 Connectivity : 

Upload logs to S3:
aws s3 cp /var/log/syslog s3://terraform-ec2-log-bucket-demo-12345/
Final Result : 
You successfully built a production-style cloud infrastructure using Terraform including:
Infrastructure as Code
Modular Terraform design
Network architecture
Compute provisioning
Database provisioning
Storage integration
IAM security configuration

- - - - - - - - - - - - - - - - - - - - - - - - - - - - Day 03 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
                         Auto Scaling + Load Balancer 
1. Terraform Modular Architecture : 
Before (Incorrect Design)
All resources were inside one module (EC2)
Mixed responsibilities:
EC2
Load Balancer
Auto Scaling
After (Correct Design)
    modules/
      ├── ec2/
      ├── alb/
      ├── autoscaling/
      ├── network/
      ├── rds/
      ├── s3/
      └── iam/

2. EC2 Module Refactoring
Changes Made
Removed:
Launch Template
Auto Scaling Group
Load Balancer
Kept only:
Security Group
Final Role
EC2 module → Only provides Security Group

3. Application Load Balancer (ALB)
Components Created
Load Balancer
Target Group
Listener
Key Learning
ALB requires minimum 2 subnets in different AZs
ALB routes traffic via Target Group
4. Auto Scaling Group (ASG)
Implemented
Launch Template
Auto Scaling Group

Important Configuration
target_group_arns → connects ALB to ASG
health_check_type = "ELB"
health_check_grace_period = 60

Key Learning
ASG does NOT automatically connect to ALB
Must explicitly attach Target Group
5. Dynamic EC2 Behavior : 
Observation
Instances created automatically by ASG
Instances terminated automatically
Key Learning : 
ASG manages lifecycle of instances
Manual EC2 is not needed
6. Instance Naming : 
Problem : 
ASG instances had no Name tag
Solution
tag {
  key                 = "Name"
  value               = var.instance_name
  propagate_at_launch = true
}

Key Learning
ASG instances need tag block
Cannot use count.index like normal EC2
7. IAM Instance Profile
Understanding
iam_instance_profile ≠ Instance Name

Purpose
Grants EC2 permission to:
S3
CloudWatch
AWS services
8. Outputs in Terraform
Learned
Outputs are optional but important
Used For
ALB URL
ASG name
RDS endpoint
Example
output "alb_url" {
  value = module.alb.alb_dns
}
9. Error Handling & Debugging : 
Issues Faced
Unsupported arguments
Invalid index
Missing variables
Wrong module references
Key Learning : 
Always match:
variables.tf
main.tf
outputs.tf
10. Real AWS Architecture Built : 
          User
             ↓
          Route53 (Domain)
             ↓
          ALB
             ↓
          Target Group
             ↓
          Auto Scaling Group
             ↓
          EC2 Instances (Nginx)

Key Takeaways : 
Separate modules = clean architecture
ALB + ASG must be connected via Target Group
Auto Scaling replaces manual EC2
Tags are required for naming in ASG
Terraform outputs improve usability
Next Learning Plan : 
✅ Add HTTPS (SSL with ACM)
✅ Domain routing with Route53
✅ CI/CD pipeline (Jenkins + Terraform)
✅ Monitoring with CloudWatch

- - - - - - - - - - - - - - - - - - - - - End of Day Learning 🚀 - - - - - - - - - - - - - - - - - - - - - - - - - - 
