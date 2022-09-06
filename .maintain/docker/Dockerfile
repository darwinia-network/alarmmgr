FROM debian:stable-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY shared/ /usr/local/bin

ENTRYPOINT [ "/usr/local/bin/alarmmgr" ]
