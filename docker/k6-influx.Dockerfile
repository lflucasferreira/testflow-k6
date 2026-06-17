# k6 with xk6-output-influxdb for real-time metrics → InfluxDB v2
# https://github.com/grafana/xk6-output-influxdb

FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git

ENV GOTOOLCHAIN=auto
RUN go install go.k6.io/xk6/cmd/xk6@v1.4.6

RUN xk6 build \
  --with github.com/grafana/xk6-output-influxdb@v0.7.0 \
  --output /k6

FROM alpine:3.20

RUN apk add --no-cache ca-certificates \
  && adduser -D -u 12345 -g 12345 k6

COPY --from=builder /k6 /usr/bin/k6

USER 12345
WORKDIR /scripts
ENTRYPOINT ["k6"]
