                                     Complete DevOps CI/CD Setup
    
                                 Jenkins + Docker + SonarQube + Nginx + AWS EC2

This project demonstrates a complete CI/CD pipeline setup for deploying multiple applications using:

AWS EC2
Jenkins
Docker & Docker Compose
GitHub
SonarQube
Nginx Reverse Proxy
SSH authentication
SonarQube Webhook integration

1, Jenkins Server Setup : 
            Install Java
                  sudo apt update
                   sudo apt install openjdk-17-jdk -y
2, Install Jenkins : 
               curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
               /usr/share/keyrings/jenkins-keyring.asc > /dev/null

                sudo apt install jenkins -y
         Start Jenkins:
                 sudo systemctl start jenkins
                 sudo systemctl enable jenkins

         Access:
                  http://JENKINS_PUBLIC_IP:8080
3, Install Tools on Jenkins Server : 
                sudo apt install git -y
                sudo apt install docker.io -y
                sudo apt install docker-compose-plugin -y

       Allow Jenkins to run Docker:
                  sudo usermod -aG docker jenkins
                  sudo systemctl restart jenkins
4, Jenkins Plugins : 
            Install:
                  Git Plugin
                  Pipeline
                  Docker Pipeline
                  SonarQube Scanner
                  Credentials Binding
                  SSH Agent
5, SonarScanner Setup : 
                Manage Jenkins → Global Tool Configuration

                Add:
                       SonarScanner
6, SonarQube Server Setup : 
           Install Docker:
                   sudo apt install docker.io -y
 Run SonarQube:
 docker run -d --name sonarqube -p 9000:9000 sonarqube:lts

Access : http://SONAR_SERVER_IP:9000
Login:
        admin / admin
7, Create SonarQube Project : 

Create Project : 
     Example:
              Project Name → Truelysell
              Project Key  → Truelysell

      Repeat for:
                 Rehbot-Marine
8, Generate Sonar Token : 

     My Account → Security
              Generate token:
               jenkins-token
9, Add Sonar Token in Jenkins : 

  Manage Jenkins → Credentials
      Add:
           Kind → Secret Text
           ID → Sonar-Token
           Secret → <token>


10, Configure SonarQube Server in Jenkins : 

      Manage Jenkins → Configure System
            Add:
                  Name → Sonar-Qube
                  URL → http://172.31.40.252:9000
                  Token → Sonar-Token
11, SonarQube Webhook Setup : 
            Go to:
                  SonarQube → Project → Webhooks
            Add webhook:
                      URL:
                           http://JENKINS_IP:8080/sonarqube-webhook/
      This allows Jenkins to receive Quality Gate results.
12, GitHub Setup : 

Create repositories:
              Truelysell-Jenkins
              Rehbot-Marine-Service

Push code:
           git init
           git add .
           git commit -m "initial commit"
           git branch -M main
           git remote add origin git@github.com:username/repo.git
           git push -u origin main
13, Jenkins SSH Setup : 

Switch to Jenkins user:
                sudo su - jenkins
       Generate SSH key:
                    ssh-keygen
        Copy key:
                  cat ~/.ssh/id_rsa.pub
14, Add SSH Key to GitHub : 

            GitHub → Settings → SSH Keys
                        Add Jenkins key.
15, SSH Jenkins → Application Server : 

                  ssh-copy-id ubuntu@APPLICATION_SERVER_IP
           Test:
                 ssh ubuntu@172.31.35.110
16, Application Server Setup : 

         Install Docker:
                  sudo apt install docker.io -y
                  sudo apt install docker-compose-plugin -y



17, Truelysell Docker Setup : 

Dockerfile : 

FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev \
    libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring xml zip bcmath

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . 
.
# Create ALL required Laravel directories BEFORE composer install
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Give permission BEFORE composer install
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

#  Important: disable scripts during build
RUN composer install --no-dev --optimize-autoloader --no-scripts

CMD ["php-fpm"]





Compose.yml : 

services:
  app:
    image: dovin121/truelysell:latest
    container_name: truelysell-php
    networks:
      - truelysell-network
  nginx:
    image: nginx:latest
    container_name: truelysell-nginx
    ports:
      - "8001:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - truelysell-network
  mysql:
    image: mysql:8
    container_name: truelysell-mysql
    restart: always
    environment:
      MYSQL_DATABASE: truelysell
      MYSQL_USER: truelyselluser
      MYSQL_PASSWORD: StrongPassword123
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - truelysell-network
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: truelysell-phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: mysql
      MYSQL_ROOT_PASSWORD: rootpassword
    depends_on:
      - mysql
    networks:
      - truelysell-network
networks:
  truelysell-network:
volumes:
  mysql-data:
Container Nginx Config : 

server {
    listen 80;
    server_name _;
    root /var/www/public;
    index index.php index.html;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    # Serve static files directly
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf)$ {
        expires max;
        access_log off;
        try_files $uri =404;
    }
    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    location ~ /\.ht {
        deny all;
    }
}




18, Rehoboth Docker Setup : 
Frontend Dockerfile : 

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]










Backend Dockerfile : 


FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]



Nginx. Conf File : 

server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    # React routing
    location / {
        try_files $uri /index.html;
    }
    # Backend API proxy
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}

Compose.yml : 

version: "3.9"
services:
  mongo:
    image: mongo:6
    container_name: RMS-MONGO
    restart: always
    ports:
      - "27017:27017"
  backend:
    build:
      context: ./backend
    container_name: RMS-BACKEND
    env_file:
      - ./backend/.env
    depends_on:
      - mongo
    ports:
      - "5000:5000"
  frontend:
    build:
      context: .
    container_name: RMS-FRONTEND
    depends_on:
      - backend
    ports:
      - "8002:80"


19, Host Nginx Reverse Proxy : 

            Install Nginx on application server:
            sudo apt install nginx -y



Host Nginx Config :

1, Truelysell Application Host Nginx : 

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
    # Force browser to upgrade HTTP assets to HTTPS
    add_header Content-Security-Policy "upgrade-insecure-requests" always;
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Ssl on;
        proxy_redirect http:// https://;
    }
}


Enable site:
sudo ln -s /etc/nginx/sites-available/devops /etc/nginx/sites-enabled/

Restart nginx:
sudo systemctl restart nginx



1, Rehoboth Application Host Nginx : 

server {
    listen 80;
    server_name www.dovin.xyz;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name www.dovin.xyz;
    ssl_certificate /etc/letsencrypt/live/dovin.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dovin.xyz/privkey.pem;
    # Fix mixed content
    add_header Content-Security-Policy "upgrade-insecure-requests" always;
    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
    }
}


Enable site:
sudo ln -s /etc/nginx/sites-available/devops /etc/nginx/sites-enabled/

Restart nginx:
sudo systemctl restart nginx




20, Jenkins Pipeline : 

Truelysell Application Pipeline : 



pipeline {
 agent any

 environment {
  SERVER = "ubuntu@172.31.35.110"
  APP_DIR = "/home/ubuntu/Truelysell-Jenkins"
  BRANCH = "main"
  SCANNER_HOME = tool 'SonarScanner'
 }

 stages {

  stage('Checkout Code'){
   steps{
    git branch: 'main', url: 'https://github.com/Dovin2005/Truelysell-Jenkins.git'
   }
  }

  stage('Update Repo On Server'){
   steps{
    sh """
    ssh $SERVER '

    # Ensure project directory exists
    mkdir -p $APP_DIR

    # Fix permissions before git operations
    sudo chown -R ubuntu:ubuntu $APP_DIR || true

    if [ ! -d "$APP_DIR/.git" ]; then
        git clone https://github.com/Dovin2005/Truelysell-Jenkins.git $APP_DIR
    fi

    cd $APP_DIR

    git config --global --add safe.directory $APP_DIR

    git fetch origin --quiet
    git reset --hard origin/$BRANCH --quiet
    '
    """
   }
  }

  stage('Check Docker Changes'){
   steps{
    script {
     def changes = sh(
       script: """
       ssh $SERVER '
       cd $APP_DIR
       git diff --name-only HEAD~1 HEAD | grep -E "Dockerfile|compose.yml|docker-compose.yml" || true
       '
       """,
       returnStdout: true
     ).trim()

     if (changes) {
       env.REBUILD = "true"
     } else {
       env.REBUILD = "false"
     }
    }
   }
  }

  stage('Build Docker Image'){
   when {
    expression { env.REBUILD == "true" }
   }
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR
    docker compose build
    '
    """
   }
  }

  stage('Restart Containers'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR
    docker compose up -d
    '
    """
   }
  }

  stage('Install Dependencies'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR

    docker compose exec -T app composer install --no-interaction --optimize-autoloader

    # Create .env if missing
    docker compose exec -T app sh -c "[ -f .env ] || cp .env.example .env"

    docker compose exec -T app php artisan key:generate --force || true
    '
    """
   }
  }

  stage('Run Unit Tests'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR
    docker compose exec -T app vendor/bin/phpunit
    '
    """
   }
  }

  stage('SonarQube Analysis'){
   steps{
    withSonarQubeEnv('Sonar-Qube'){
     withCredentials([string(credentialsId: 'Sonar-Token', variable: 'SONAR_TOKEN')]){

      sh """
      ${SCANNER_HOME}/bin/sonar-scanner \
       -Dsonar.projectKey=Truelysell \
       -Dsonar.sources=app,routes,resources \
       -Dsonar.exclusions=vendor/**,node_modules/**,public/**,storage/**,bootstrap/**,tests/** \
       -Dsonar.host.url=http://172.31.40.252:9000 \
       -Dsonar.token=$SONAR_TOKEN
      """

     }
    }
   }
  }

  stage('Quality Gate'){
   steps{
    timeout(time:15, unit:'MINUTES'){
     waitForQualityGate abortPipeline: true
    }
   }
  }

  stage('Laravel Setup'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR

    docker compose exec -T app php artisan migrate --force || true

    docker compose exec -T app php artisan cache:clear
    docker compose exec -T app php artisan config:clear
    docker compose exec -T app php artisan route:clear
    docker compose exec -T app php artisan view:clear

    docker compose exec -T app php artisan config:cache
    docker compose exec -T app php artisan view:cache

    # Restore Laravel permissions
    docker compose exec -T app chown -R www-data:www-data storage bootstrap/cache
    '
    """
   }
  }

 }

 post{
  success{
   echo 'Deployment successful'
  }
  failure{
   echo 'Deployment failed'
  }
 }
}






2, Rehoboth Application Script : 


pipeline {
 agent any

 environment {
  SERVER = "ubuntu@172.31.35.110"
  APP_DIR = "/home/ubuntu/Rehbot-Marine-Service"
  BRANCH = "main"
  SCANNER_HOME = tool 'SonarScanner'
 }

 stages {

  stage('Checkout Code'){
   steps{
    git branch: 'main',
        url: 'git@github.com:Dovin2005/Rehbot-Marine-Service.git'
   }
  }

  stage('Update Repository On Server'){
   steps{
    sh """
    ssh $SERVER '

    # Fix permission issues
    sudo chown -R ubuntu:ubuntu $APP_DIR || true

    # Clone repository if missing
    if [ ! -d "$APP_DIR/.git" ]; then
        git clone git@github.com:Dovin2005/Rehbot-Marine-Service.git $APP_DIR
    fi

    cd $APP_DIR

    git config --global --add safe.directory $APP_DIR

    # Pull latest code
    git fetch origin
    git reset --hard origin/$BRANCH
    '
    """
   }
  }

  stage('Build Docker Containers'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR

    echo "Building Docker containers..."
    docker compose build
    '
    """
   }
  }

  stage('Restart Containers'){
   steps{
    sh """
    ssh $SERVER '
    cd $APP_DIR

    echo "Restarting containers..."
    docker compose down
    docker compose up -d
    '
    """
   }
  }

  stage('SonarQube Analysis'){
   steps{
    withSonarQubeEnv('Sonar-Qube'){
     withCredentials([string(credentialsId: 'Sonar-Token', variable: 'SONAR_TOKEN')]){

      sh """
      ${SCANNER_HOME}/bin/sonar-scanner \
       -Dsonar.projectKey=Rehbot-Marine \
       -Dsonar.sources=backend,src \
       -Dsonar.exclusions=node_modules/**,dist/**,public/** \
       -Dsonar.host.url=http://172.31.40.252:9000 \
       -Dsonar.token=$SONAR_TOKEN
      """

     }
    }
   }
  }

  stage('Quality Gate'){
   steps{
    timeout(time:10, unit:'MINUTES'){
     waitForQualityGate abortPipeline: true
    }
   }
  }

 }

 post{
  success{
   echo "Rehbot Marine Service Deployment Successful"
  }

  failure{
   echo "Deployment Failed"
  }
 }
}




Example:
       Checkout Code
       SonarQube Scan
       Quality Gate
       SSH Deploy
       Docker Compose Restart


Final Deployment

    Applications accessible via domains:
             1, https://dovin.xyz

             2, https://rehoboth.dovin.xyz
