FROM node:20
USER root

#RUN npm -g config set user root

#RUN npm install -g encoding-down leveldown levelupmemdown subleveldown
#RUN npm install -g node-lmdb
RUN npm install -g cross-env

# APP
RUN mkdir -p /app
WORKDIR /app
COPY package.json .
RUN yarn install

COPY /server server
COPY /front front
RUN npm run build

EXPOSE 8001

#CMD /start-service.sh
CMD node server/start.js --dbAccess
