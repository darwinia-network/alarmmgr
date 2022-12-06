FROM node:18-alpine3.15
COPY . /opt/alarmmgr
RUN cd /opt/alarmmgr && npm run boot
WORKDIR /opt/alarmmgr
CMD [
  "npm",
  "run",
  "start",
  "--"
]
