                                    🔐 Secure EC2 Access Using Per-User SSH Keys (No PEM Sharing)


# Overview

This guide explains how to securely provide access to an AWS EC2 instance **without sharing your `.pem` key**, by:

              - Creating a separate Linux user on EC2
              - Generating SSH keys on the client user's machine
              - Configuring SSH key-based authentication
              - Applying correct Linux permissions
              - Optionally granting sudo access

# Step 1: Create a New Linux User on EC2

  Login to your EC2 instance as the default user (`ubuntu`):

        bash 
           sudo adduser devuser

        Set a password (used only for su, not SSH login)

        Press Enter to skip optional fields

        User devuser is created
        

# Step 2: Create .ssh Directory for the User

         sudo mkdir /home/devuser/.ssh
         sudo chmod 700 /home/devuser/.ssh

         This directory will store SSH authentication files.
         

# Step 3: Generate SSH Key on Client Machine

  Ask the user to generate an SSH key on their own system.

    Linux / macOS
    
       ssh-keygen -t rsa -b 4096
       
    Windows (PowerShell)

      ssh-keygen

    This will generate:

    id_rsa → ❌ Private Key (DO NOT SHARE)

    id_rsa.pub → ✅ Public Key (SAFE TO SHARE)

    Ask the user to send only:

    id_rsa.pub

    
# Step 4: Add Public Key to EC2 Server

  On the EC2 instance:

         sudo nano /home/devuser/.ssh/authorized_keys

         Paste the entire public key in one line

   Save and exit
   

# Step 5: Fix Permissions (⚠️ Critical Step)

   Incorrect permissions will cause SSH authentication failure.

        sudo chmod 600 /home/devuser/.ssh/authorized_keys
        sudo chown -R devuser:devuser /home/devuser/.ssh
        
   Required Permissions:
   
   File/Directory	Permission
   
        .ssh directory	700
        authorized_keys	600

        
# Step 6: (Optional) Grant Sudo Access

  Only if administrative privileges are required:

      sudo usermod -aG sudo devuser

  Skip this step if not needed (more secure).
  

# Step 7: Client Connection Instructions

  The client connects using their private key.

      If using default key location:
      
           ssh devuser@<EC2_PUBLIC_IP>
           
      If using a custom key file:
      
           ssh -i /path/to/id_rsa devuser@<EC2_PUBLIC_IP>

# Security Best Practices

# Never share .pem or private keys

# Always use per-user SSH access

# Assign minimal required permissions

# Remove access when no longer needed

# Use IAM + SSM for advanced setups (optional)
