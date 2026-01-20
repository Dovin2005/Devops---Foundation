🔐 Secure EC2 Access Using Per-User SSH Keys (No PEM Sharing)
📌 Overview

This guide explains how to securely give another user access to an AWS EC2 instance without sharing your .pem key, by:

Creating a separate Linux user on EC2

Generating SSH keys on the client user’s laptop

Configuring SSH key-based authentication

Applying correct Linux permissions

Optionally granting sudo access

This is a best practice approach used in real environments.

🧩 STEP 1: Create a New Linux User on EC2

You are already logged in as the ubuntu user.

sudo adduser devuser


Set a password (used only for su, not SSH)

Press Enter for other prompts

✅ New user created

🧩 STEP 2: Create .ssh Directory for the User
sudo mkdir /home/devuser/.ssh
sudo chmod 700 /home/devuser/.ssh


This directory will store SSH authorization files.

🧩 STEP 3: Generate SSH Key on CLIENT User’s Laptop

Ask the other person to generate an SSH key on their own system.

On Linux / macOS
ssh-keygen -t rsa -b 4096

On Windows (PowerShell)
ssh-keygen


This generates two files:

id_rsa → ❌ PRIVATE KEY (must stay on client machine)

id_rsa.pub → ✅ PUBLIC KEY (safe to share)

👉 Ask them to send ONLY:

id_rsa.pub

🧩 STEP 4: Add the PUBLIC Key to the Server

On the EC2 instance, open the authorized keys file:

sudo nano /home/devuser/.ssh/authorized_keys


Paste the entire public key in one line, then save and exit.

🧩 STEP 5: Fix Permissions (VERY IMPORTANT)

Incorrect permissions will cause SSH to fail.

sudo chmod 600 /home/devuser/.ssh/authorized_keys
sudo chown -R devuser:devuser /home/devuser/.ssh


Required permissions:

.ssh directory → 700

authorized_keys file → 600

🧩 STEP 6: (Optional) Grant Sudo Access

Only if the user needs admin privileges:

sudo usermod -aG sudo devuser


➡️ Skip this step if sudo access is not required (more secure).

🧪 STEP 7: How the CLIENT User Connects (UPDATED)

From their own laptop, the user connects using their private key.

If the private key is in the default location (~/.ssh/id_rsa):
ssh devuser@<ec2-public-dns>

If the private key has a custom name or location:
ssh -i id_rsa devuser@<ec2-public-dns>
