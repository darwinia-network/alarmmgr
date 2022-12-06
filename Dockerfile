FROM node:18-alpine3.15
COPY . /opt/alarmmgr
RUN cd /opt/alarmmgr && \
    npm install && \
    npm run boot && \
    npm run build:all
WORKDIR /opt/alarmmgr
ENTRYPOINT ["/opt/alarmmgr/alarmmgr.sh"]
