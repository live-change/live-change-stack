FROM node:20
USER root

#RUN npm -g config set user root

RUN npm install -g encoding-down
RUN npm install -g leveldown
RUN npm install -g levelup
RUN npm install -g memdown
RUN npm install -g node-lmdb
RUN npm install -g subleveldown
RUN npm install -g typescript

RUN npm install -g @live-change/db-client@`echo "console.log(require('./package.json').version)" | node`

# APP
RUN mkdir -p /app
WORKDIR /app
COPY package.json package.json
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc yarn install --verbose --network-timeout 3600000
RUN cd node_modules/@live-change/db-admin/; npm run build
COPY /bin bin
COPY /lib lib
COPY index.js index.js
COPY tsconfig.json tsconfig.json
RUN npm run build

EXPOSE 9417

RUN mkdir /data

CMD /app/bin/server.js --verbose serve --dbRoot /data
