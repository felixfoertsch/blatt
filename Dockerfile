FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src/ src/
COPY templates/ templates/

ENV BLATT_DATA_DIR=/data
EXPOSE 3000

CMD ["bun", "src/index.ts"]
