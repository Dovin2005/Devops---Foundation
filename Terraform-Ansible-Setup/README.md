                                    # 🚀 DevOps Project: Terraform + Ansible + Docker + AWS (Updated)


# Project Overview

         This project demonstrates a **complete real-world DevOps workflow** using:

     * **Terraform** → Infrastructure provisioning
     * **Ansible** → Configuration management
     * **Docker** → Application deployment
     * **AWS** → Cloud platform
     * **Prometheus + Grafana** → Monitoring


# Architecture

     User → Domain (dovin.xyz)
             ↓
     Application Load Balancer (ALB)
             ↓
     Auto Scaling Group (EC2 Instances)
             ↓
     Docker / Nginx Application

       Separate:
            Monitoring EC2
                ↓
            Prometheus + Grafana

# Technologies Used

      * AWS (EC2, ALB, Auto Scaling, IAM, Route53, S3, DynamoDB)
      * Terraform
      * Ansible
      * Docker
      * Prometheus
      * Grafana


# Step 1: Infrastructure Setup (Terraform)

    ## 📁 Project Structure

          Terraform-Setup/
          │
          ├── backend-setup/
          ├── modules/
          │   ├── VPC/
          │   ├── ALB/
          │   ├── AutoScaling/
          │   ├── IAM/
          │   ├── RDS/
          │   ├── S3/
          │   └── monitoring-EC2/
          │
          ├── main.tf
          ├── variables.tf
          ├── outputs.tf
          ├── provider.tf

# What Terraform Created

  # Networking

       * Custom VPC
       * Public & Private Subnets
       * Internet Gateway

  # Load Balancer

       * Application Load Balancer (ALB)

  # Compute

       * Auto Scaling Group (Min:1, Desired:2, Max:3)

   # Database

        * RDS (MySQL)

   # Storage

        * S3 Bucket (for logs)

  # Security

          * IAM Roles
          * Security Groups

  # Domain

          * Route53 → `dovin.xyz` → ALB

   # Monitoring

          * Separate EC2 instance (Elastic IP)


# Remote Backend

       * S3 → Terraform state
       * DynamoDB → State locking


# Commands Used

         terraform init
         terraform plan
         terraform apply

# Step 2: Auto Scaling Fixes (Important Learning)

   ## Problems Faced

           * Multiple EC2 instances created on every apply
           * Security Group not attaching to ASG instances


   ## Fixes Implemented

# 1. Launch Template Version Issue

           $Latest → caused continuous replacement 

           ✔ Fixed using stable version reference

# 2. Security Group Issue (Critical)

       network_interfaces block 

       ✔ Replaced with:

       vpc_security_group_ids ✅

# Key Learning

> Always use `vpc_security_group_ids` in Launch Templates for ASG.

---

# 🚀 Step 3: Ansible Setup

## 📁 Structure (Updated)

```text
ansible/
│
├── ansible.cfg
├── inventory/aws_ec2.yml
├── group_vars/
│   ├── app.yml
│   └── monitoring.yml
├── roles/
│   ├── app/
│   └── monitoring/
└── site.yml
```

---

## 🔹 Dynamic Inventory

* Uses AWS plugin to fetch EC2 instances
* Automatically groups:

  * app → ASG instances
  * monitoring → monitoring server

---

## 🔹 Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install ansible boto3 botocore certifi
ansible-galaxy collection install amazon.aws
```

---

## 🔹 Common Issues Fixed

### ❌ SSH Key Error

✔ Fixed path in `ansible.cfg`

### ❌ Python Interpreter Error

✔ Used `/usr/bin/python3`

### ❌ SSL Error

✔ Installed `certifi`

---

# 🚀 Step 4: Application Deployment

## 🔹 App Servers (ASG)

Installed using Ansible:

* Docker
* Nginx
* Node.js

Started services:

* Docker
* Nginx

---

## 🔹 Docker Deployment

* Built Docker image
* Pushed to Docker Hub
* Pulled and ran container using Ansible

---

## ⚠️ Important Learning

> Ansible is not reliable for ASG instances (because instances are dynamic)

✔ Best Practice:

* Use Terraform `user_data` for ASG
* Use Ansible for static servers

---

# 🚀 Step 5: Monitoring Setup

## 🔹 Monitoring Server

Installed using Ansible:

### Grafana

* Added repository
* Installed package
* Started `grafana-server`

---

### Prometheus

✔ Downloaded & extracted
✔ Created user
✔ Created directories
✔ Configured systemd service
✔ Fixed permissions

---

## ❌ Issues Faced & Fixes

### 1. Grafana Not Found

✔ Added Grafana repo

---

### 2. Prometheus 404 Error

✔ Used version-specific download URL

---

### 3. Prometheus Service Failed

✔ Fixed permissions:

```text
/var/lib/prometheus
/etc/prometheus
```

✔ Automated using Ansible

---

# 🌐 Access URLs

| Service     | URL                      |
| ----------- | ------------------------ |
| Application | http://dovin.xyz         |
| Grafana     | http://<monitor-ip>:3000 |
| Prometheus  | http://<monitor-ip>:9090 |

---

# 📊 Current Status

| Component      | Status               |
| -------------- | -------------------- |
| ALB + ASG      | ✅ Working            |
| Nginx          | ✅ Running            |
| Docker App     | ✅ Running            |
| Domain Routing | ✅ Working            |
| Grafana        | ✅ Running            |
| Prometheus     | ✅ Running            |
| Metrics        | ❌ Not yet configured |

---

# 🧠 Key Learnings (Major)

### 🔥 Terraform

* Launch Template best practices
* ASG lifecycle behavior
* Remote backend setup

---

### 🔥 Ansible

* Dynamic inventory with AWS
* Roles & modular structure
* SSH + Python debugging

---

### 🔥 AWS

* ALB + ASG integration
* Security group debugging
* Private vs public subnet

---

### 🔥 Monitoring

* Prometheus service setup
* Grafana integration
* Linux permission handling

---

# 🚀 Future Improvements

* Add **Node Exporter** for metrics
* Connect Prometheus to EC2 instances
* Build Grafana dashboards
* Add alerting system
* Implement CI/CD (GitHub Actions / Jenkins)

---

# 🎯 Interview Summary

> Designed and deployed a scalable AWS infrastructure using Terraform with Auto Scaling and Load Balancer, automated configuration using Ansible with dynamic EC2 inventory, deployed containerized applications using Docker, and implemented monitoring using Prometheus and Grafana.

---

# 👨‍💻 Author

**Nikil Dovin**

---

# ⭐ Final Outcome

✔ Scalable infrastructure
✔ Automated deployment
✔ Monitoring system deployed
✔ Real-world DevOps workflow implemented

---
