                         AWS DevOps Project – Complete Terraform Journey (Beginner to Advanced)


# Overview: 
 
        This document explains the **complete journey from scratch**:

           * Installing Terraform & AWS CLI
           * Connecting to AWS
           * Writing Terraform code
           * Building infrastructure
           * Creating production-level architecture
           

# STEP 1 — Install Terraform: 

  # Mac (Homebrew)

        brew install terraform

  # Verify Installation: 

        terraform -v
        

# STEP 2 — Install AWS CLI:

  # Mac:

      brew install awscli


  # Verify Installation:

      aws --version
      

# STEP 3 — Configure AWS Credentials

   # Run:

       aws configure


   # Enter:

       AWS Access Key ID
       AWS Secret Access Key
       Region (example: us-east-2)
       Output format: json
       
  # These credentials connect Terraform → AWS
  

# STEP 4 — Verify AWS Connection:

       aws sts get-caller-identity

   # Confirms AWS access is working ✅
   

# STEP 5 — Install Terraform Providers

 ## Create a file:

  ### provider.tf`


          terraform {
            required_version = ">= 1.3.0"

            required_providers {
              aws = {
                source = "hashicorp/aws"
              }
            }
          }

          provider "aws" {
            region = "us-east-2"
          }


# STEP 6 — Initialize Terraform

       terraform init

  ## Downloads AWS provider plugin


# STEP 7 — Basic Terraform Commands:

        terraform plan   # preview changes
        terraform apply  # create infrastructure
        terraform destroy # delete infrastructure


# STEP 8 — Setup Remote State (IMPORTANT):

   # Create S3 Bucket:

        aws s3 mb s3://terraform-state-bucket-demo-12345

   # Create DynamoDB Table:

        aws dynamodb create-table \
          --table-name terraform-lock \
          --attribute-definitions AttributeName=LockID,AttributeType=S \
          --key-schema AttributeName=LockID,KeyType=HASH \
          --billing-mode PAY_PER_REQUEST

   # Update `provider.tf`:


        terraform {
          backend "s3" {
            bucket         = "terraform-state-bucket-demo-12345"
            key            = "project/terraform.tfstate"
            region         = "us-east-2"
            dynamodb_table = "terraform-lock"
          }
        }

      * S3 stores state file
      * DynamoDB prevents conflicts


# STEP 9 — Create Project Structure:


     Terraform-Setup/
     │
     ├── main.tf
     ├── variables.tf
     ├── outputs.tf
     ├── provider.tf
     ├── terraform.tfvars
     │
     └── modules/
         ├── VPC/
         ├── ALB/
         ├── AutoScaling/
         ├── EC2-sg/
         ├── RDS/
         ├── IAM/
         └── S3/

         
# STEP 10 — Create VPC (Networking)

     * VPC
     * Public Subnets
     * Private Subnets
     * Internet Gateway
     * Route Tables

      👉 Learned:

            * Public → Internet access
            * Private → secure services (RDS)


# STEP 11 — Security Groups:

          Internet → ALB → EC2 → RDS


  ## Rules:

       * ALB → allow 80, 443 from internet
       * EC2 → allow only from ALB
       * RDS → allow only from EC2

        👉 Learned:

             * Secure layered access
             * No direct public access to EC2


# STEP 12 — Key Pair (SSH Access):

      Terraform creates:


             tls_private_key
             aws_key_pair


        👉 Generates `.pem` file for EC2 login



# STEP 13 — Auto Scaling EC2

      * Launch Template
      * Auto Scaling Group


            min = 2
            max = 3
            desired = 2


    👉 Learned:

            * Automatic scaling
            * High availability


# STEP 14 — Application Load Balancer (ALB)

      * Public ALB
      * Target Group
      * Listeners

   👉 Learned:

         * Distributes traffic
         * Connects users → EC2


# STEP 15 — HTTPS Setup (ACM)

      * Request certificate
      * Validate via Route53
      * Attach to ALB

   👉 Learned:

      * SSL works only with domain
      * Not with ALB DNS
      

# STEP 16 — Route53 (Domain)

     * Hosted zone: `dovin.xyz`
     * A record → ALB

   👉 Learned:

       * Domain → AWS mapping


#  STEP 17 — RDS (Database)

       * MySQL database
       * Private subnets
       * Security group access

    👉 Learned:

       * DB should never be public
       * Only EC2 can connect


# STEP 18 — Variables Management

  ## Used:

   ### terraform.tfvars`


         project_name = "myapp"
         environment  = "dev"

         db_username = "admin"
         db_password = "MySecurePassword123"


     👉 Learned:

          * Avoid hardcoding values
          * Use environment-based config


# STEP 19 — Apply Infrastructure:


           terraform init
           terraform plan
           terraform apply



# FINAL ARCHITECTURE


          User
           ↓
          Route53 (dovin.xyz)
           ↓
          ALB (HTTPS)
           ↓
          Auto Scaling EC2
           ↓
          RDS (Private)



# FINAL OUTCOME

     ✔ Infrastructure automated
     ✔ Secure networking
     ✔ Auto Scaling enabled
     ✔ HTTPS enabled
     ✔ Domain working
     ✔ Remote state configured


#  WHAT I LEARNED


      Terraform Basics
      AWS Infrastructure
      Security Best Practices
      Auto Scaling
      Load Balancing
      HTTPS Setup
      Remote State Management


