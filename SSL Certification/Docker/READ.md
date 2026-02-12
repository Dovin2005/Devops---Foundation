Domain Setup (Route 53)

Step 1 – Update Nameservers (Hostinger)

Go to Domain → Nameservers

Choose “Use custom nameservers”

Paste AWS Route 53 nameservers

Remove trailing dot

Step 2 – Create A Record (Route 53)

Hosted Zone → Create Record:

Type: A

Name: (leave blank)

Value: EC2 Public IP

TTL: 300

Routing: Simple

To Verify:

nslookup dovin.xyz

Step 3 - EC2 Server Setup

Install certbot:

sudo apt install certbot -y

Generate certificate:

sudo certbot certonly --standalone -d dovin.xyz

Certificates will be stored at:

/etc/letsencrypt/live/dovin.xyz/

Important files:

fullchain.pem
privkey.pem

Update nginx.conf

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dovin.xyz;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    server_name dovin.xyz;

    ssl_certificate /etc/letsencrypt/live/dovin.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dovin.xyz/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

Then Build Image And Run The Conatiner Like

docker run -d --name frontend --network docker -p 80:80 -p 443:443 -v /etc/letsencrypt:/etc/letsencrypt frontend

https://dovin.xyz
