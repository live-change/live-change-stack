FROM node:16
USER root

RUN npm -g config set user root

RUN npm install -g encoding-down
RUN npm install -g leveldown
RUN npm install -g levelup
RUN npm install -g memdown
RUN npm install -g node-lmdb
RUN npm install -g subleveldown

COPY package.json .
RUN npm install -g @live-change/db-server@`echo "console.log(require('./package.json').version)" | node`
RUN npm install -g @live-change/db-client@`echo "console.log(require('./package.json').version)" | node`
RUN rm package.json

RUN cd /usr/local/lib/node_modules/@live-change/db-server/node_modules/@live-change/db-admin/; npm run build

EXPOSE 9417

RUN mkdir /data

CMD lcdbd --verbose serve --dbRoot /data
