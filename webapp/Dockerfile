# use this Dockerfile to build the image from the local source code with:
# docker build -t files/watts-app-webapp .
# run the container with:
# docker run -p 3030:3030 --name webapp -d files/watts-app-webapp
FROM lucsorel/zeromq-bindings:alpinelinux3.3-zeromq4.3.x-nodejs4.3.x
MAINTAINER Luc Sorel

# builds the folders of the NodeJS web application
RUN mkdir -p /usr/local/watts-app/webapp/api && \
    mkdir -p /usr/local/watts-app/webapp/factory && \
    mkdir -p /usr/local/watts-app/webapp/monitoring && \
    mkdir -p /usr/local/watts-app/webapp/test && \
    mkdir -p /usr/local/watts-app/webapp/www/js && \
    mkdir -p /usr/local/watts-app/webapp/www/style && \
    mkdir -p /usr/local/watts-app/webapp/www/templates

# installs the dependencies the NodeJS web application
WORKDIR /usr/local/watts-app/webapp
COPY package.json server.js /usr/local/watts-app/webapp/
RUN apk add --no-cache git && \
    npm install && \
    apk del openssl ca-certificates libssh2 curl pcre git

# copies the webapp modules
COPY api /usr/local/watts-app/webapp/api
COPY factory /usr/local/watts-app/webapp/factory
COPY monitoring /usr/local/watts-app/webapp/monitoring
COPY test /usr/local/watts-app/webapp/test
COPY www /usr/local/watts-app/webapp/www
COPY www/js /usr/local/watts-app/webapp/www/js
COPY www/style /usr/local/watts-app/webapp/www/style
COPY www/templates /usr/local/watts-app/webapp/www/templates

# exposes http port
EXPOSE 3030

# starts the container application
CMD [ "npm", "start" ]
