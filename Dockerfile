FROM node:20-alpine
COPY . /opt/alarmmgr
RUN cd /opt/alarmmgr && \
    yarn install && \
    yarn build:all
WORKDIR /opt/alarmmgr
ENTRYPOINT ["/opt/alarmmgr/alarmmgr.sh"]
