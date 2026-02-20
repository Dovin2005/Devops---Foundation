                                                          Laravel Docker + Jenkins Deployment

Docker & Compose Installation

Install Docker

             sudo apt update
             sudo apt install docker.io -y
             sudo systemctl enable docker
             sudo systemctl start docker

Add permission:

            sudo usermod -aG docker $USER

Install Docker Compose (plugin):
   
           sudo apt install docker-compose-plugin -y

1, Dockerfile (PHP App)


FROM php:8.4-fpm
RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev \
    libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring xml zip bcmath
RUN pecl install xdebug \
 && docker-php-ext-enable xdebug
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --optimize-autoloader

RUN mkdir -p storage bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

CMD ["php-fpm"]


2, Nginx Configuration (nginx/default.conf)
Handles HTTP requests.
server {
    listen 80;
    server_name _;
    root /var/www/public;
    index index.php index.html;
    charset utf-8;
    client_max_body_size 100M;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ ^/index\.php(/|$) {
        fastcgi_pass app:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        internal;
    }
    location ~ \.php$ {
        return 404;
    }
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|map)$ {
        try_files $uri =404;
        expires max;
     access_log off;
    }
    location ~ /\.(?!well-known).* {
        deny all;
    }
}



3, Docker Compose (compose.yml)

version: "3.9"

Services:

  app:
    build: .
    container_name: truelysell-php
  volumes:
     -.:/var/www 
    networks:
      - truelysell-network

  nginx:
    image: nginx:latest
    container_name: truelysell-nginx
    ports:
      - "80:80"
    volumes:
      - .:/var/www     
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
  Truelysell-network:

volumes:
  mysql-data:
  
 
4, Build & Run Containers

     First time setup:
     cd /home/ubuntu/truelysell-laravel-v1

     docker-compose build
     docker-compose up -d
     Check:
     docker ps

     

5, Install Laravel Dependencies

      Because code is mounted:
      docker-compose exec app composer install
      

6, Generate Laravel App Key

      docker-compose exec app php artisan key:generate
      docker-compose exec app php artisan optimize:clear
      docker-compose exec app php artisan tinker
      
      
7, Import Database

      docker exec -i truelysell-mysql mysql -u truelyselluser -pStrongPassword123 truelysell < truelysell-laravel-new.sql
      
      
8, Run Migrations

      docker-compose exec app php artisan migrate

      
9, Fix Permissions

      docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
      docker-compose exec app mkdir -p storage/framework/sessions
      docker-compose exec app mkdir -p storage/framework/views
      docker-compose exec app mkdir -p storage/logs
      docker-compose exec app chmod -R 775 storage bootstrap/cache
      

Check The Website Using Url



Jenkins Installation

Install  JAVA:
     sudo apt update
     sudo apt install fontconfig openjdk-21-jre
      java -version
      
      
Install Jenkins:
     sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
     https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
     echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
     https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
     /etc/apt/sources.list.d/jenkins.list > /dev/null
    sudo apt update
    sudo apt install jenkins

Access The Jenkins Web


FIrst Time Admin Unlock Password Path:
      sudo cat /var/lib/jenkins/secrets/initialAdminPassword
      

After That Install Suggested Plugins


SonarQube Installation (Docker)
   docker run -d --name sonarqube -p 9001:9000 sonarqube:lts-community

Access The Sonarqube In Web 

First Time Login Credential

  Username : admin
  Password : admin

Generate Sonar Token
SonarQube → Profile → Security → Generate Token  - - - - -  Copy The Token Paste In Notepad



Jenkins → Add SonarQube
Manage Jenkins → Plugins:

Install:
SonarQube Scanner
Docker
Git


Pipeline
Add Sonar Token in Jenkins
        Manage Jenkins → Credentials → Global → Add
        Type → Secret text
        Paste token
ID:
     Sonar-token


Configure Sonar Server
       Manage Jenkins → Configure System → SonarQube Servers
Name:
      SonarQube
URL:
     http://SERVER-IP:9001
Token → select sonar-token


Configure SonarQube Webhook
    SonarQube → Administration → Webhooks → Create
       http://SERVER-IP:8080/sonarqube-webhook/


Sonar Need The Node.js 
  Sonar analyzes:

JavaScript
CSS
Vite frontend
Install:
         sudo apt install nodejs npm -y



Jenkins Permission Setup
          sudo chown -R jenkins:jenkins /home/ubuntu/truelysell-laravel-v1

After That Restart The Jenkins


                                      Jenkins CI/CD Pipeline       
                                       Automates deployment.

     
Final Jenkins Script



pipeline {
 agent any

 environment {
  APP_DIR="/home/ubuntu/truelysell-laravel-v1"
  BRANCH="main"
  SCANNER_HOME=tool 'SonarScanner'
 }

 stages {

  stage('Fix Permissions'){
   steps{
    sh 'sudo chown -R jenkins:jenkins $APP_DIR || true'
   }
  }
 stage('Update Repo'){
   steps{
    sh '''
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
    '''
   }
  }

  stage('Build Image'){
   steps{
    sh '''
    cd $APP_DIR
    docker compose build app
    '''
   }
  }

  stage('Recreate Containers'){
   steps{
    sh '''
    cd $APP_DIR
    docker compose rm -f app nginx || true
    docker compose up -d app nginx
    '''
   }
  }
  stage('Install Dependencies'){
   steps{
    sh '''
    cd $APP_DIR
    docker compose exec -T app composer install --optimize-autoloader
    docker compose exec -T app sh -c "[ -f .env ] || cp .env.example .env"
    docker compose exec -T app php artisan key:generate --force || true
    '''
   }
  }

  stage('Run Unit Tests'){
   steps{
    sh '''
    cd $APP_DIR
    docker compose exec -T -e XDEBUG_MODE=coverage app vendor/bin/phpunit --coverage-clover coverage.xml
    '''
   }
  }
  stage('SonarQube Analysis'){
   steps{
    withSonarQubeEnv('SonarQube'){
     sh """
     ${SCANNER_HOME}/bin/sonar-scanner \
      -Dsonar.projectKey=Truelysell \
      -Dsonar.sources=${APP_DIR} \
      -Dsonar.php.coverage.reportPaths=${APP_DIR}/coverage.xml 
     """
    }
   }
  }

  stage('Quality Gate'){
   steps{
    timeout(time:15,unit:'MINUTES'){
     waitForQualityGate abortPipeline:true
    }
   }
  }

  stage('Laravel Setup'){
   steps{
    sh '''
    cd $APP_DIR
    docker compose exec -T app php artisan migrate --force || true
    docker compose exec -T app php artisan optimize || true
    '''
   }
  }
 }
 post{
  success{ echo 'Deployment successful' }
  failure{ echo 'Deployment failed' }
 }
}



