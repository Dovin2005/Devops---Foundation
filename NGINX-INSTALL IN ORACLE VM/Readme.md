                                        # NGINX---INSTALL---ORACLE---VM


# STEP:1 - Deploying Nginx on Oracle Virtual Machine

   ## Environment
 
           - Oracle Virtual Machine
           - Ubuntu Linux

# STEP:2 - NGINX INSTALLATION STEPS

      1. `sudo apt update`  
             Used to update the package list.

      2. `sudo apt install nginx -y`  
             Used to install the Nginx web server.

      3. `sudo systemctl start nginx`  
            Used to start the Nginx service.

      4. `sudo systemctl enable nginx`  
             Enables the Nginx service to start automatically when the system boots.

      5. `sudo systemctl status nginx`  
             Used to check the status of the Nginx service.

      6. Accessed Nginx using `http://10.0.2.15` to verify the installation.

            Result

                   Nginx is successfully installed and running on Oracle Ubuntu VM.
