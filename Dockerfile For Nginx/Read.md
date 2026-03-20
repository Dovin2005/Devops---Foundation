                                           ## What I Learned from This Task


# During this Jira task, I learned the basics of containerizing an application using Docker and running Nginx inside a container.

   # Key learnings:

               How a Dockerfile is used to build a Docker image

               Difference between Dockerfile, Image, and Container

               How to install packages in Alpine Linux using apk

               How to expose ports from a container

               How to run containers in detached mode

               How to map host ports to container ports

               How Nginx configuration controls the document root

               How to troubleshoot 404 errors inside containers

               How AWS security groups affect external access

               How to access the application using the EC2 public IP
               

# Dockerfile I Wrote

     FROM alpine:latest

     RUN apk update && apk add nginx

     COPY ./index.html /usr/share/nginx/html/index.html

     COPY ./nginx.conf /etc/nginx/http.d/default.conf

     EXPOSE 80

     CMD ["nginx", "-g", "daemon off;"]
     

# What Each Line Does

   ## FROM alpine:latest
   
           → Uses Alpine Linux as the base image.

   ## RUN apk update && apk add nginx
   
           → Updates package index and installs Nginx.

   ## COPY ./index.html /usr/share/nginx/html/index.html
   
           → Copies the website file into the container.

   ## COPY ./nginx.conf /etc/nginx/http.d/default.conf
   
           → Replaces default Nginx config so the site is served.

   ## EXPOSE 80
   
           → Documents that the container listens on port 80.

   ## CMD ["nginx", "-g", "daemon off;"]
   
           → Runs Nginx in foreground so the container stays alive.

# Commands I Ran

   ## Build the Image
   
          docker build -t nginx-server .

   ## Run the Container
   
          docker run -d -p 80:80 --name nginx-site nginx-server

   ## Check Running Containers
   
          docker ps

# Test Inside Server

         curl http://localhost

         Access from Browser
         http://<EC2-PUBLIC-IP>
