                                  # 🚀 WordPress Deployment on AWS EC2 using LAMP Stack


# Project Overview

This project demonstrates how to **install and configure a LAMP stack** (Linux, Apache, MySQL, PHP) and **deploy a WordPress application** on an **AWS EC2 instance**.  

The setup follows real-world practices including **secure database configuration**, **proper file permissions**, and **clean WordPress access using public IP**.


# Tech Stack Used

        - **Linux** – Ubuntu 20.04 / 22.04  
        - **Apache** – Web Server  
        - **MySQL** – Database Server  
        - **PHP** – Backend Scripting Language  
        - **WordPress** – Content Management System (CMS)  
        - **AWS EC2** – Cloud Virtual Machine  


# Project Objectives
  
        - Install and configure a LAMP stack on AWS EC2
        - Deploy WordPress at the Apache document root
        - Secure MySQL using best practices
        - Apply correct file and directory permissions
        - Access WordPress directly via public IP
        

# Architecture (3-Tier Model)

          User (Browser)
              ↓
          Apache Web Server (Port 80)
              ↓
          PHP (WordPress Application)
              ↓
          MySQL Database

     yaml
       Copy code


# Prerequisites

        - AWS Account
        - EC2 instance with Ubuntu OS
        - Key pair (`.pem` file)
        - Security Group allowing:
         - SSH (22)
         - HTTP (80)
         - HTTPS (443 – optional)


# Installation & Setup

# STEP:1 Connect to EC2 Instance

           ssh -i key.pem ubuntu@<public-ip>

# STEP:2 Update the System

          sudo apt update
          
     Purpose:
          Updates package index and ensures latest security patches.

# STEP:3 Install Apache Web Server

        sudo apt install apache2 -y
        sudo systemctl start apache2
        sudo systemctl enable apache2
        
     Purpose:
         Apache handles incoming HTTP requests and serves web content.

# STEP:4 Install MySQL Database Server

        sudo apt install mysql-server -y
        sudo mysql_secure_installation
   
    Purpose:
        MySQL stores WordPress data such as posts, users, and site settings.

        Security actions performed:

        Disabled remote root login

        Removed test database

        Improved password policy

# STEP:5 Create WordPress Database and User

           sudo mysql
           
           
               CREATE DATABASE wordpress
               CHARACTER SET utf8mb4
               COLLATE utf8mb4_unicode_ci;

               CREATE USER 'wpuser'@'localhost'
               IDENTIFIED WITH mysql_native_password
               BY 'StrongPassword123!';

               GRANT ALL PRIVILEGES ON wordpress.* TO 'wpuser'@'localhost';
               FLUSH PRIVILEGES;
               EXIT;

       Purpose:

           Uses a dedicated database and user (least privilege principle)

           localhost restricts database access to the same server
           
           utf8mb4 supports full Unicode characters

# STEP:6 Install PHP and Required Extensions

             sudo apt install php php-mysql php-cli php-curl php-gd php-xml php-mbstring -y
             sudo systemctl restart apache2

      Purpose:
            WordPress is a PHP-based application and requires these extensions for database connectivity, image handling, and API   communication.

# STEP:7 Download and Extract WordPress

          cd /var/www/html
          sudo wget https://wordpress.org/latest.tar.gz
          sudo tar -xzf latest.tar.gz
          sudo rm latest.tar.gz
          
# STEP:8 Move WordPress to Apache Document Root

          sudo mv wordpress/* .
          sudo rm -rf wordpress

    Purpose:
          Allows WordPress to load directly from the public IP without /wordpress in the URL.

# STEP:9 Set Correct File Permissions

          sudo chown -R www-data:www-data /var/www/html
          sudo find /var/www/html -type d -exec chmod 755 {} \;
          sudo find /var/www/html -type f -exec chmod 644 {} \;

      Why these permissions?

            Apache runs as www-data

            Directories (755) allow traversal

            Files (644) prevent unauthorized modification

            Avoids insecure 777 permissions

# STEP:10 Configure WordPress

          cd /var/www/html
          cp wp-config-sample.php wp-config.php
          sudo nano wp-config.php
    
    Update database settings:

        php
        
          define('DB_NAME', 'wordpress');
          define('DB_USER', 'wpuser');
          define('DB_PASSWORD', 'StrongPassword123!');
          define('DB_HOST', 'localhost');
          
# STEP:11 Remove Apache Default Page

           sudo rm /var/www/html/index.html
           sudo systemctl restart apache2

     Purpose:
           Apache loads index.html before index.php. Removing it allows WordPress to load correctly.

# Access WordPress

         http://<public-ip>
         WordPress login:



# Issues Faced & Resolution

   ### Issue
           Error establishing a database connection

   ### Root Cause
            MySQL default authentication plugin (caching_sha2_password) not compatible with WordPress

   ### Resolution
          Switched authentication to mysql_native_password

          Updated wp-config.php

          Restarted MySQL and Apache services
 
# Final Result

         LAMP stack installed successfully

         WordPress deployed on AWS EC2

         Website accessible via public IP

         WordPress admin dashboard working correctly

         Secure and production-ready setup

