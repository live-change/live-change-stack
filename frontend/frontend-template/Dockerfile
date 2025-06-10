FROM --platform=amd64 debian:buster

# SYSTEM
RUN echo no cache 3
RUN apt-get -qq update
RUN apt-get install -qq -y wget curl apt-utils git openssh-server locales gnupg2 make cmake gcc g++ unzip nano \
    alpine-pico fish rsync

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8
RUN echo "LC_ALL=en_US.UTF-8" >> /etc/environment
RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
RUN echo "LANG=en_US.UTF-8" > /etc/locale.conf
RUN locale-gen en_US.UTF-8

# NODE
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

#NPM, PM2
RUN npm install cross-env yarn typescript -g

# APP
RUN mkdir -p /app
WORKDIR /app
COPY package-deps.json package.json
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc yarn install

COPY /data data
RUN mkdir -p /app/docker
COPY docker/restore-backup-with-service.sh /app/docker/restore-backup-with-service.sh
COPY docker/restore-backup.sh /app/docker/restore-backup.sh
COPY /front front
COPY /server server
COPY package.json package.json
COPY tsconfig.json tsconfig.json

ARG VERSION='unknown'
ENV VERSION=$VERSION
RUN echo "VERSION=$VERSION" >> /etc/environment

RUN npm run build

# START
EXPOSE 8001
EXPOSE 8007
COPY docker/start-service.sh /start-service.sh
COPY docker/app.initd.sh /etc/init.d/app

#CMD /start-service.sh
CMD node --inspect=0.0.0.0:9229 --max-old-space-size=512 dist/server/start.js ssrServer --withApi --withServices --updateServices --enableSessions --createDb
