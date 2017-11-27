################## BEGIN INSTALLATION ######################
# Set the base image to ubuntu
FROM node:latest
WORKDIR /src/

# File Author / Maintainer
MAINTAINER Simon Meoni

## ENVIRONMENTS VARIABLES
ENV USER_COREA2D user
ENV PWD_COREA2D password
ENV SQL_COREA2D sql_url
ENV ELASTIC_COREA2D elastic_url

## COPY PROJECT FILES
COPY . .
RUN npm install

##################### INSTALLATION END #####################
EXPOSE 3000
CMD npm start
