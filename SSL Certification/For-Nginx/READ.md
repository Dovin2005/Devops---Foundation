🚀 FULL SETUP GUIDE

Domain: dovin.xyz
Server: AWS EC2 Ubuntu
Web Server: Nginx
SSL: Let’s Encrypt

🌍 PART 1 — Route 53 Configuration

1️⃣ Create Hosted Zone

Go to:

AWS Console → Route 53 → Hosted Zones → Create Hosted Zone

Domain name: dovin.xyz

Type: Public hosted zone

After creation, AWS gives 4 nameservers like:

ns-xxxx.awsdns-xx.org
ns-xxxx.awsdns-xx.com
ns-xxxx.awsdns-xx.net
ns-xxxx.awsdns-xx.co.uk

Update Nameservers in Hostinger

In Hostinger:

Go to Domain → Nameservers

Select “Use custom nameservers”

Paste the 4 AWS nameservers

Remove trailing dot (if present)

Wait 5–30 minutes for propagation.

Test:

nslookup dovin.xyz

3️⃣ Create A Record in Route 53

Go to Hosted Zone → Create Record

Record type: A

Record name: (leave blank)

Value: EC2 Public IP

TTL: 300

Routing policy: Simple

Save.

Now test:

nslookup dovin.xyz

🖥 PART 2 — EC2 Setup
1️⃣ Launch EC2 Instance

Choose:

Ubuntu 22.04

Allow inbound:

22 (SSH)

80 (HTTP)

443 (HTTPS)

2️⃣ Install Nginx

SSH into EC2:

sudo apt update
sudo apt install nginx -y

Enable & start:

sudo systemctl enable nginx
sudo systemctl start nginx

Check:

sudo systemctl status nginx

Test:

Open browser:

http://EC2_PUBLIC_IP

You should see Nginx welcome page.

🌐 PART 3 — Attach Domain to Nginx

Create config file:

sudo nano /etc/nginx/sites-available/dovin.xyz

Add:

server {
    listen 80;
    server_name dovin.xyz;


    root /var/www/html;
    index index.html;


    location / {
        try_files $uri $uri/ =404;
    }
}

Save.

Enable site:

sudo ln -s /etc/nginx/sites-available/dovin.xyz /etc/nginx/sites-enabled/

Test:

sudo nginx -t

Reload:

sudo systemctl reload nginx

Now open:

http://dovin.xyz

If this works → DNS + Nginx correct.

🔒 PART 4 — Install SSL (Let’s Encrypt)

Install certbot plugin:

sudo apt install python3-certbot-nginx -y

Now run:

sudo certbot --nginx -d dovin.xyz

It will ask:

Enter email

Agree terms

Choose redirect (Select 2)

Certbot automatically:

✔ Generates certificate
✔ Adds SSL config
✔ Adds HTTP → HTTPS redirect
✔ Reloads Nginx

You do NOT edit SSL manually.

When you run:

sudo certbot --nginx -d dovin.xyz

Certbot will automatically modify:

/etc/nginx/sites-available/dovin.xyz

Not directly sites-enabled.

Remember:

sites-enabled/dovin.xyz is just a symlink

The real file is inside sites-available/

Certbot edits the real file

🔎 What Actually Happens Internally

If your current file is:

server {
    listen 80;
    server_name dovin.xyz;


    root /var/www/html;
    index index.html;


    location / {
        try_files $uri $uri/ =404;
    }
}

After running certbot, it becomes something like this:

server {
    listen 80;
    server_name dovin.xyz;
    return 301 https://$host$request_uri;
}


server {
    listen 443 ssl;
    server_name dovin.xyz;


    ssl_certificate /etc/letsencrypt/live/dovin.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dovin.xyz/privkey.pem;


    root /var/www/html;
    index index.html;


    location / {
        try_files $uri $uri/ =404;
    }
}

Certbot also:

Creates certificate files

Validates domain

Reloads nginx

Sets up auto-renew

✅ Verify SSL

Open:

https://dovin.xyz
