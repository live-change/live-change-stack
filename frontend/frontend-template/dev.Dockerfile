FROM --platform=amd64 debian:buster

# SYSTEM
RUN echo no cache 3
RUN apt-get -qq update
RUN apt-get install -qq -y wget curl apt-utils git openssh-server locales gnupg2 make cmake gcc g++ unzip nano \
    alpine-pico fish rsync zip

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

# NPM YARN
RUN npm install cross-env yarn tsx typescript -g

# PATH
ENV PATH="${PATH}:/app/node_modules/.bin"
RUN echo 'export PATH="/app/node_modules/.bin:$PATH"' >> /root/.bashrc
RUN echo 'export HMR_PORT=9001' >> /root/.bashrc

EXPOSE 8001
EXPOSE 9001

WORKDIR /app

# APP
CMD bash -c "sleep infinity"
