FROM node:18-alpine

WORKDIR /usr/app/api

RUN npm install -g nodemon

COPY package*.json .

RUN npm install

COPY . .