# 🚀 WordPress Deployment on AWS EC2 using LAMP Stack

## 📌 Project Overview
This project demonstrates how to **install and configure a LAMP stack** (Linux, Apache, MySQL, PHP) and **deploy a WordPress application** on an **AWS EC2 instance**.  
It covers real-world server setup, database configuration, and troubleshooting commonly faced during deployment.

---

## 🧱 Tech Stack Used
- **Linux** – Ubuntu 20.04 / 22.04  
- **Apache** – Web Server  
- **MySQL** – Database  
- **PHP** – Backend scripting language  
- **WordPress** – Content Management System (CMS)  
- **AWS EC2** – Cloud virtual server  

---

## 🎯 Project Objective
- Set up a LAMP stack on AWS EC2
- Deploy WordPress on Apache
- Configure MySQL database for WordPress
- Resolve database authentication issues
- Make the website accessible via public IP

---

## 🏗 Architecture
User (Browser)  
→ Apache Web Server  
→ PHP (WordPress Application)  
→ MySQL Database  

This follows a **3-tier architecture**:
- Presentation Layer – Browser  
- Application Layer – Apache + PHP  
- Database Layer – MySQL  

---

## ⚙️ Prerequisites
- AWS account
- EC2 instance with Ubuntu OS
- Key pair (`.pem` file)
- Security Group allowing:
  - SSH (22)
  - HTTP (80)
  - HTTPS (443 – optional)

---

## 🛠 Installation & Setup

### 1️⃣ Connect to EC2 Instance
```bash
ssh -i key.pem ubuntu@<public-ip>

2️⃣ Update the System
sudo apt update


Purpose:
Updates the package index to ensure the latest and secure packages are installed.

3️⃣ Install Apache Web Server
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2


Purpose:
Apache is used to serve web pages and handle HTTP requests.

4️⃣ Install MySQL Database Server
sudo apt install mysql-server -y
sudo mysql_secure_installation


Purpose:
MySQL stores WordPress data such as posts, users, and site settings.

5️⃣ Install PHP and Required Extensions
sudo apt install php php-mysql php-cli php-curl php-gd php-xml php-mbstring -y
sudo systemctl restart apache2


Purpose:
WordPress is a PHP-based application and these extensions enable database connectivity, image handling, and API communication.

6️⃣ Install WordPress
cd /var/www/html
sudo wget https://wordpress.org/latest.tar.gz
sudo tar -xzf latest.tar.gz
sudo chown -R www-data:www-data wordpress
sudo chmod -R 755 wordpress


Purpose:
Downloads the latest WordPress version, extracts it, and assigns proper permissions.

7️⃣ Create WordPress Database and User
sudo mysql

CREATE DATABASE wordpress;
CREATE USER 'wpuser'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wpuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;


Purpose:
Creates a dedicated database and user for WordPress to securely store application data.

8️⃣ Fix MySQL Authentication Issue
ALTER USER 'wpuser'@'localhost'
IDENTIFIED WITH mysql_native_password
BY 'StrongPassword123!';
FLUSH PRIVILEGES;


Purpose:
Resolves WordPress database connection issues caused by MySQL authentication plugin mismatch.

9️⃣ Configure WordPress
cd /var/www/html/wordpress
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php


Update database configuration:

define('DB_NAME', 'wordpress');
define('DB_USER', 'wpuser');
define('DB_PASSWORD', 'StrongPassword123!');
define('DB_HOST', 'localhost');


Set correct ownership:

sudo chown www-data:www-data wp-config.php

🔟 Complete Installation via Browser

Open the browser and navigate to:

http://<public-ip>/wordpress


Complete the WordPress installer by:

Selecting language

Entering database details

Creating admin user

Finishing installation

🐞 Issues Faced & Resolution
Issue

Error establishing a database connection

Root Cause

MySQL authentication plugin mismatch (caching_sha2_password)

Resolution

Switched authentication to mysql_native_password

Updated wp-config.php

Restarted MySQL and Apache services

✅ Final Result

LAMP stack installed successfully

WordPress deployed on AWS EC2

Website accessible via public IP

WordPress admin dashboard working correctly

🧠 Key Learnings

LAMP stack installation and configuration

AWS EC2 networking and security groups

MySQL authentication troubleshooting

WordPress deployment in real environments


